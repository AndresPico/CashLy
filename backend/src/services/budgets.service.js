import { supabaseAdmin } from './supabase.service.js';

const rangeColumnsSupport = { value: null };
const amountColumn = { value: null };

const today = () => new Date().toISOString().slice(0, 10);
const toCurrentMonth = () => new Date().toISOString().slice(0, 7);

const isMissingColumnError = (error, columnName) =>
  Boolean(
    error?.message?.toLowerCase().includes(`column budgets.${columnName} does not exist`) ||
      error?.message?.toLowerCase().includes(`could not find the '${columnName}' column`)
  );

const toMonthRange = (month) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, monthNumber - 1, 1));
  const endDate = new Date(Date.UTC(year, monthNumber, 0));

  return {
    period_start: startDate.toISOString().slice(0, 10),
    period_end: endDate.toISOString().slice(0, 10)
  };
};

const toMonthTimestampRange = (month) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1, 0, 0, 0));
  const nextMonthStart = new Date(Date.UTC(year, monthNumber, 1, 0, 0, 0));

  return {
    created_from: start.toISOString(),
    created_to: nextMonthStart.toISOString()
  };
};

const resolvePeriodRange = ({ month, period, period_start, period_end }) => {
  if (month) {
    return {
      period: period || 'monthly',
      month,
      ...toMonthRange(month)
    };
  }

  if (period_start && period_end) {
    return {
      period: period || 'monthly',
      month: period_start.slice(0, 7),
      period_start,
      period_end
    };
  }

  const currentMonth = toCurrentMonth();
  return {
    period: period || 'monthly',
    month: currentMonth,
    ...toMonthRange(currentMonth)
  };
};

const getBudgetAmount = (budget) => {
  if (typeof budget.limit_amount !== 'undefined') {
    return Number(budget.limit_amount || 0);
  }

  return Number(budget.amount || 0);
};

const ensureAmountColumn = async () => {
  if (amountColumn.value) {
    return amountColumn.value;
  }

  const limitAmountProbe = await supabaseAdmin
    .from('budgets')
    .select('limit_amount')
    .limit(1);

  if (!limitAmountProbe.error) {
    amountColumn.value = 'limit_amount';
    return amountColumn.value;
  }

  if (!isMissingColumnError(limitAmountProbe.error, 'limit_amount')) {
    throw limitAmountProbe.error;
  }

  const amountProbe = await supabaseAdmin
    .from('budgets')
    .select('amount')
    .limit(1);

  if (!amountProbe.error) {
    amountColumn.value = 'amount';
    return amountColumn.value;
  }

  throw amountProbe.error;
};

const ensureRangeColumnsSupport = async () => {
  if (typeof rangeColumnsSupport.value === 'boolean') {
    return rangeColumnsSupport.value;
  }

  const { error } = await supabaseAdmin
    .from('budgets')
    .select('period_start, period_end')
    .limit(1);

  if (!error) {
    rangeColumnsSupport.value = true;
    return true;
  }

  if (isMissingColumnError(error, 'period_start') || isMissingColumnError(error, 'period_end')) {
    rangeColumnsSupport.value = false;
    return false;
  }

  throw error;
};

const getCategoryById = async (categoryId, userId) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, name, type, color, icon')
    .eq('id', categoryId)
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new Error('Category not found');
  return data;
};

const getBudgetByIdInternal = async (id, userId) => {
  const { data, error } = await supabaseAdmin
    .from('budgets')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new Error('Budget not found');
  return data;
};

const ensureExpenseCategory = async (categoryId, userId) => {
  const category = await getCategoryById(categoryId, userId);
  if (category.type !== 'expense') {
    throw new Error('Budgets can only be created for expense categories');
  }
};

const normalizeBudgetPeriod = (budget, fallbackMonth) => {
  const normalizedAmount = getBudgetAmount(budget);

  if (budget.period_start && budget.period_end) {
    return {
      ...budget,
      amount: normalizedAmount,
      limit_amount: normalizedAmount,
      month: budget.period_start.slice(0, 7)
    };
  }

  const month = fallbackMonth || budget.created_at?.slice(0, 7) || toCurrentMonth();
  const range = toMonthRange(month);

  return {
    ...budget,
    amount: normalizedAmount,
    limit_amount: normalizedAmount,
    ...range,
    month
  };
};

const ensureUniqueBudget = async ({
  userId,
  categoryId,
  period,
  month,
  periodStart,
  periodEnd,
  excludeId
}) => {
  const supportsRangeColumns = await ensureRangeColumnsSupport();

  let query = supabaseAdmin
    .from('budgets')
    .select('id')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('period', period);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  if (supportsRangeColumns) {
    query = query
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd);
  } else {
    const createdRange = toMonthTimestampRange(month);
    query = query
      .gte('created_at', createdRange.created_from)
      .lt('created_at', createdRange.created_to);
  }

  const { data, error } = await query.limit(1);
  if (error) throw error;

  if (data?.length) {
    throw new Error('This category already has a budget for the selected period');
  }
};

const calculateStatus = (percentage) => {
  if (percentage >= 100) return 'exceeded';
  if (percentage >= 70) return 'warning';
  return 'healthy';
};

const attachProgress = async (budgets, userId) => {
  if (!budgets?.length) return [];

  const normalizedBudgets = budgets.map((budget) => normalizeBudgetPeriod(budget));
  const categoryIds = [...new Set(normalizedBudgets.map((budget) => budget.category_id))];
  const minPeriodStart = normalizedBudgets.reduce(
    (acc, budget) => (budget.period_start < acc ? budget.period_start : acc),
    normalizedBudgets[0].period_start
  );
  const maxPeriodEnd = normalizedBudgets.reduce(
    (acc, budget) => (budget.period_end > acc ? budget.period_end : acc),
    normalizedBudgets[0].period_end
  );

  const [categoriesResult, transactionsResult] = await Promise.all([
    supabaseAdmin
      .from('categories')
      .select('id, name, type, color, icon')
      .eq('user_id', userId)
      .in('id', categoryIds),
    supabaseAdmin
      .from('transactions')
      .select('id, category_id, amount, date')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .in('category_id', categoryIds)
      .gte('date', minPeriodStart)
      .lte('date', maxPeriodEnd)
  ]);

  if (categoriesResult.error) throw categoriesResult.error;
  if (transactionsResult.error) throw transactionsResult.error;

  const categoriesMap = new Map(
    (categoriesResult.data || []).map((category) => [category.id, category])
  );

  return normalizedBudgets.map((budget) => {
    const currentSpent = (transactionsResult.data || [])
      .filter(
        (transaction) =>
          transaction.category_id === budget.category_id &&
          transaction.date >= budget.period_start &&
          transaction.date <= budget.period_end
      )
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const amount = Number(budget.amount || 0);
    const usagePercentage = amount > 0 ? (currentSpent / amount) * 100 : 0;
    const remainingAmount = amount - currentSpent;
    const category = categoriesMap.get(budget.category_id) || null;

    return {
      ...budget,
      category,
      current_spent: currentSpent,
      usage_percentage: Number(usagePercentage.toFixed(2)),
      remaining_amount: Number(remainingAmount.toFixed(2)),
      status: calculateStatus(usagePercentage)
    };
  });
};

const buildSummary = (items, month) => {
  const total_budgeted = items.reduce(
    (sum, budget) => sum + Number(budget.amount || 0),
    0
  );
  const total_spent = items.reduce(
    (sum, budget) => sum + Number(budget.current_spent || 0),
    0
  );
  const total_remaining = total_budgeted - total_spent;
  const resolvedMonth = month || toCurrentMonth();

  return {
    month: resolvedMonth,
    ...toMonthRange(resolvedMonth),
    total_budgeted: Number(total_budgeted.toFixed(2)),
    total_spent: Number(total_spent.toFixed(2)),
    total_remaining: Number(total_remaining.toFixed(2))
  };
};

export async function createBudget(payload, userId) {
  const { category_id, amount, period = 'monthly' } = payload;
  const range = resolvePeriodRange(payload);
  const supportsRangeColumns = await ensureRangeColumnsSupport();
  const resolvedAmountColumn = await ensureAmountColumn();

  await ensureExpenseCategory(category_id, userId);

  if (!supportsRangeColumns && range.month !== toCurrentMonth()) {
    throw new Error('Database migration required to create budgets in months different from current month');
  }

  await ensureUniqueBudget({
    userId,
    categoryId: category_id,
    period,
    month: range.month,
    periodStart: range.period_start,
    periodEnd: range.period_end
  });

  const insertPayload = {
    user_id: userId,
    category_id,
    period
  };
  insertPayload[resolvedAmountColumn] = amount;

  if (supportsRangeColumns) {
    insertPayload.period_start = range.period_start;
    insertPayload.period_end = range.period_end;
  }

  const { data: budget, error } = await supabaseAdmin
    .from('budgets')
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw error;

  const [enriched] = await attachProgress([normalizeBudgetPeriod(budget, range.month)], userId);
  return enriched;
}

export async function getBudgets(userId, query = {}) {
  const month = query.month || toCurrentMonth();
  const supportsRangeColumns = await ensureRangeColumnsSupport();
  await ensureAmountColumn();

  let budgetsQuery = supabaseAdmin
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('period', 'monthly');

  if (supportsRangeColumns) {
    const range = toMonthRange(month);
    budgetsQuery = budgetsQuery
      .eq('period_start', range.period_start)
      .eq('period_end', range.period_end);
  } else {
    const createdRange = toMonthTimestampRange(month);
    budgetsQuery = budgetsQuery
      .gte('created_at', createdRange.created_from)
      .lt('created_at', createdRange.created_to);
  }

  const { data: budgets, error } = await budgetsQuery.order('created_at', { ascending: false });
  if (error) throw error;

  const items = await attachProgress(
    (budgets || []).map((budget) => normalizeBudgetPeriod(budget, month)),
    userId
  );

  return {
    items,
    summary: buildSummary(items, month)
  };
}

export async function getBudgetById(id, userId) {
  await ensureAmountColumn();
  const budget = await getBudgetByIdInternal(id, userId);
  const [enriched] = await attachProgress([normalizeBudgetPeriod(budget)], userId);
  return enriched;
}

export async function updateBudget(id, userId, updates) {
  const currentBudget = await getBudgetByIdInternal(id, userId);
  const currentNormalized = normalizeBudgetPeriod(currentBudget);
  const supportsRangeColumns = await ensureRangeColumnsSupport();
  const resolvedAmountColumn = await ensureAmountColumn();

  if (currentNormalized.period_end < today()) {
    throw new Error('Closed period budgets cannot be modified');
  }

  const nextPeriod = updates.period || currentBudget.period || 'monthly';
  const nextRange = resolvePeriodRange({
    month: updates.month || currentNormalized.month,
    period: nextPeriod,
    period_start: updates.period_start,
    period_end: updates.period_end
  });

  if (!supportsRangeColumns && nextRange.month !== currentNormalized.month) {
    throw new Error('Database migration required to move budgets to another month');
  }

  if (nextRange.period_start < toMonthRange(toCurrentMonth()).period_start) {
    throw new Error('Budget period updates must target current or future months');
  }

  const payload = {};

  if (typeof updates.amount === 'number') {
    payload[resolvedAmountColumn] = updates.amount;
  }

  if (updates.month || updates.period_start || updates.period_end || updates.period) {
    payload.period = nextPeriod;

    if (supportsRangeColumns) {
      payload.period_start = nextRange.period_start;
      payload.period_end = nextRange.period_end;
    }

    await ensureUniqueBudget({
      userId,
      categoryId: currentBudget.category_id,
      period: payload.period,
      month: nextRange.month,
      periodStart: nextRange.period_start,
      periodEnd: nextRange.period_end,
      excludeId: id
    });
  }

  const { data, error } = await supabaseAdmin
    .from('budgets')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  const [enriched] = await attachProgress(
    [normalizeBudgetPeriod(data, nextRange.month)],
    userId
  );
  return enriched;
}

export async function deleteBudget(id, userId) {
  await getBudgetByIdInternal(id, userId);

  const { error } = await supabaseAdmin
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}
