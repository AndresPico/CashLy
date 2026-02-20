import { supabaseAdmin } from './supabase.service.js';

const goalTableCache = { value: undefined };
const goalColumnsCache = {
  targetAmount: undefined,
  startDate: undefined,
  targetDate: undefined,
  frequency: undefined,
  description: undefined,
  status: undefined,
  accountId: undefined
};
const goalsViewCache = { value: undefined };
const contributionTableCache = { value: undefined };
const contributionColumnsCache = {
  userId: undefined,
  accountId: undefined,
  date: undefined,
  description: undefined
};

const today = () => new Date().toISOString().slice(0, 10);

const isMissingColumnError = (error, table, column) =>
  Boolean(
    error?.message?.toLowerCase().includes(`column ${table}.${column} does not exist`) ||
      error?.message?.toLowerCase().includes(`could not find the '${column}' column`)
  );

const isMissingRelationError = (error, relation) =>
  Boolean(
    error?.message?.toLowerCase().includes(`relation \"${relation}\" does not exist`) ||
      error?.message?.toLowerCase().includes(`relation \"public.${relation}\" does not exist`) ||
      error?.message?.toLowerCase().includes(`could not find the table '${relation}'`) ||
      error?.message?.toLowerCase().includes(`could not find the table 'public.${relation}'`) ||
      error?.message?.toLowerCase().includes(`relation '${relation}' does not exist`)
  );

const ensureGoalTable = async () => {
  if (goalTableCache.value !== undefined) {
    return goalTableCache.value;
  }

  const candidates = ['saving_goals', 'goals'];

  for (const table of candidates) {
    const { error } = await supabaseAdmin.from(table).select('id').limit(1);

    if (!error) {
      goalTableCache.value = table;
      return table;
    }

    if (!isMissingRelationError(error, table)) {
      throw error;
    }
  }

  throw new Error('Goals table not found. Expected saving_goals or goals.');
};

const detectGoalColumn = async (cacheKey, candidates) => {
  if (goalColumnsCache[cacheKey] !== undefined) {
    return goalColumnsCache[cacheKey];
  }

  const goalTable = await ensureGoalTable();

  for (const column of candidates) {
    const { error } = await supabaseAdmin
      .from(goalTable)
      .select(column)
      .limit(1);

    if (!error) {
      goalColumnsCache[cacheKey] = column;
      return column;
    }

    if (!isMissingColumnError(error, goalTable, column)) {
      throw error;
    }
  }

  goalColumnsCache[cacheKey] = null;
  return null;
};

const ensureGoalColumns = async () => {
  const targetAmount = await detectGoalColumn('targetAmount', [
    'target_amount',
    'goal_amount',
    'amount'
  ]);

  if (!targetAmount) {
    throw new Error('Missing target amount column in goals table');
  }

  await detectGoalColumn('targetDate', ['target_date', 'deadline', 'end_date']);
  await detectGoalColumn('startDate', ['start_date']);
  await detectGoalColumn('frequency', ['frequency']);
  await detectGoalColumn('description', ['description']);
  await detectGoalColumn('status', ['status']);
  await detectGoalColumn('accountId', ['account_id']);

  return goalColumnsCache;
};

const ensureGoalsProgressView = async () => {
  if (goalsViewCache.value !== undefined) {
    return goalsViewCache.value;
  }

  const candidates = ['saving_goals_with_progress', 'goals_with_progress'];

  for (const viewName of candidates) {
    const { error } = await supabaseAdmin.from(viewName).select('id').limit(1);

    if (!error) {
      goalsViewCache.value = viewName;
      return viewName;
    }

    if (!isMissingRelationError(error, viewName)) {
      throw error;
    }
  }

  goalsViewCache.value = null;
  return null;
};

const ensureContributionTable = async () => {
  if (contributionTableCache.value !== undefined) {
    return contributionTableCache.value;
  }

  const candidates = [
    'saving_goal_contributions',
    'goal_contributions',
    'goals_contributions'
  ];

  for (const table of candidates) {
    const { error } = await supabaseAdmin.from(table).select('id').limit(1);

    if (!error) {
      contributionTableCache.value = table;
      return table;
    }

    if (!isMissingRelationError(error, table)) {
      throw error;
    }
  }

  throw new Error(
    'Goal contributions table not found. Expected saving_goal_contributions, goal_contributions or goals_contributions.'
  );
};

const detectContributionColumn = async (cacheKey, column) => {
  if (contributionColumnsCache[cacheKey] !== undefined) {
    return contributionColumnsCache[cacheKey];
  }

  const table = await ensureContributionTable();
  const { error } = await supabaseAdmin.from(table).select(column).limit(1);

  if (!error) {
    contributionColumnsCache[cacheKey] = column;
    return column;
  }

  if (isMissingColumnError(error, table, column)) {
    contributionColumnsCache[cacheKey] = null;
    return null;
  }

  throw error;
};

const ensureContributionColumns = async () => {
  await detectContributionColumn('userId', 'user_id');
  await detectContributionColumn('accountId', 'account_id');
  await detectContributionColumn('date', 'date');
  await detectContributionColumn('description', 'description');

  return contributionColumnsCache;
};

const normalizeGoal = (rawGoal) => {
  const targetAmount = Number(
    rawGoal.target_amount ?? rawGoal.goal_amount ?? rawGoal.amount ?? 0
  );
  const savedAmount = Number(
    rawGoal.saved_amount ?? rawGoal.current_saved ?? rawGoal.current_amount ?? rawGoal.amount_saved ?? 0
  );

  const computedProgress = targetAmount > 0 ? (savedAmount / targetAmount) * 100 : 0;
  const progressPercentage = Number(rawGoal.progress_percentage ?? computedProgress);

  const status = progressPercentage >= 100
    ? 'completed'
    : rawGoal.status === 'paused'
      ? 'paused'
      : 'active';

  return {
    ...rawGoal,
    target_amount: targetAmount,
    saved_amount: savedAmount,
    remaining_amount: Number((targetAmount - savedAmount).toFixed(2)),
    progress_percentage: Number(progressPercentage.toFixed(2)),
    target_date: rawGoal.target_date ?? rawGoal.deadline ?? rawGoal.end_date ?? null,
    frequency: rawGoal.frequency ?? 'monthly',
    status
  };
};

const getAccountById = async (accountId, userId) => {
  const { data, error } = await supabaseAdmin
    .from('accounts')
    .select('id, balance')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new Error('Account not found');
  return data;
};

const updateAccountBalance = async ({ accountId, userId, expectedBalance, newBalance }) => {
  let query = supabaseAdmin
    .from('accounts')
    .update({ balance: Number(newBalance) })
    .eq('id', accountId)
    .eq('user_id', userId);

  if (typeof expectedBalance === 'number') {
    query = query.eq('balance', Number(expectedBalance));
  }

  const { error } = await query.select('id').single();
  if (error) throw error;
};

const getGoalBaseById = async (goalId, userId) => {
  const goalTable = await ensureGoalTable();

  const { data, error } = await supabaseAdmin
    .from(goalTable)
    .select('*')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new Error('Goal not found');
  return data;
};

const getContributionSumsByGoal = async (goalIds, userId) => {
  const sums = new Map(goalIds.map((goalId) => [goalId, 0]));

  if (!goalIds.length) return sums;

  let table;
  try {
    table = await ensureContributionTable();
  } catch {
    return sums;
  }

  const columns = await ensureContributionColumns();

  let query = supabaseAdmin
    .from(table)
    .select('goal_id, amount')
    .in('goal_id', goalIds);

  if (columns.userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  for (const row of data || []) {
    const current = Number(sums.get(row.goal_id) || 0);
    sums.set(row.goal_id, current + Number(row.amount || 0));
  }

  return sums;
};

const attachComputedProgress = async (goals, userId) => {
  const goalIds = goals.map((goal) => goal.id);
  const sums = await getContributionSumsByGoal(goalIds, userId);

  return goals.map((goal) =>
    normalizeGoal({
      ...goal,
      saved_amount: Number(sums.get(goal.id) || 0)
    })
  );
};

const getGoalAccumulatedAmount = async (goalId, userId) => {
  const sums = await getContributionSumsByGoal([goalId], userId);
  return Number(sums.get(goalId) || 0);
};

const syncGoalStatus = async (goalId, userId) => {
  await ensureGoalColumns();
  if (!goalColumnsCache.status) return;

  const goalTable = await ensureGoalTable();
  const goal = await getGoalBaseById(goalId, userId);
  const targetAmount = Number(goal[goalColumnsCache.targetAmount] || 0);
  const accumulatedAmount = await getGoalAccumulatedAmount(goalId, userId);

  let nextStatus = 'active';

  if (accumulatedAmount >= targetAmount) {
    nextStatus = 'completed';
  } else if (goal.status === 'paused') {
    nextStatus = 'paused';
  }

  const { error } = await supabaseAdmin
    .from(goalTable)
    .update({ status: nextStatus })
    .eq('id', goalId)
    .eq('user_id', userId);

  if (error) throw error;
};

const getContributionById = async (contributionId, goalId, userId) => {
  const table = await ensureContributionTable();
  const columns = await ensureContributionColumns();

  let query = supabaseAdmin
    .from(table)
    .select('*')
    .eq('id', contributionId)
    .eq('goal_id', goalId);

  if (columns.userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();

  if (error || !data) throw new Error('Goal contribution not found');
  return data;
};

const assertContributionAccountColumn = async () => {
  const columns = await ensureContributionColumns();

  if (!columns.accountId) {
    throw new Error(
      'goal_contributions.account_id is required to keep balances consistent. Add this column before registering contributions.'
    );
  }

  return columns;
};

export async function createGoal(data, userId) {
  await ensureGoalColumns();
  const goalTable = await ensureGoalTable();

  const payload = {
    user_id: userId,
    name: data.name,
    [goalColumnsCache.targetAmount]: data.target_amount
  };

  if (goalColumnsCache.startDate) {
    payload[goalColumnsCache.startDate] = data.start_date || today();
  }

  if (goalColumnsCache.targetDate && data.target_date) {
    payload[goalColumnsCache.targetDate] = data.target_date;
  }

  if (goalColumnsCache.frequency) {
    payload.frequency = data.frequency || 'monthly';
  }

  if (goalColumnsCache.description && typeof data.description !== 'undefined') {
    payload.description = data.description;
  }

  if (goalColumnsCache.accountId && data.account_id) {
    payload.account_id = data.account_id;
  }

  if (goalColumnsCache.status) {
    payload.status = data.status || 'active';
  }

  const { data: createdGoal, error } = await supabaseAdmin
    .from(goalTable)
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;

  return getGoalById(createdGoal.id, userId);
}

export async function getGoals(userId) {
  await ensureGoalColumns();
  const goalTable = await ensureGoalTable();
  const progressView = await ensureGoalsProgressView();

  if (progressView) {
    const { data, error } = await supabaseAdmin
      .from(progressView)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(normalizeGoal);
  }

  const { data, error } = await supabaseAdmin
    .from(goalTable)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return attachComputedProgress(data || [], userId);
}

export async function getGoalById(goalId, userId) {
  await ensureGoalColumns();
  const progressView = await ensureGoalsProgressView();

  if (progressView) {
    const { data, error } = await supabaseAdmin
      .from(progressView)
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new Error('Goal not found');
    return normalizeGoal(data);
  }

  const goal = await getGoalBaseById(goalId, userId);
  const [withProgress] = await attachComputedProgress([goal], userId);
  return withProgress;
}

export async function updateGoal(goalId, userId, updates) {
  await ensureGoalColumns();
  const goalTable = await ensureGoalTable();

  await getGoalById(goalId, userId);
  const accumulatedAmount = await getGoalAccumulatedAmount(goalId, userId);

  if (
    typeof updates.target_amount === 'number' &&
    Number(updates.target_amount) < Number(accumulatedAmount)
  ) {
    throw new Error('Target amount cannot be lower than current saved amount');
  }

  const payload = {};

  if (typeof updates.name === 'string') payload.name = updates.name;
  if (typeof updates.target_amount === 'number') {
    payload[goalColumnsCache.targetAmount] = updates.target_amount;
  }
  if (goalColumnsCache.targetDate && typeof updates.target_date !== 'undefined') {
    payload[goalColumnsCache.targetDate] = updates.target_date;
  }
  if (goalColumnsCache.description && typeof updates.description !== 'undefined') {
    payload.description = updates.description;
  }
  if (goalColumnsCache.frequency && typeof updates.frequency !== 'undefined') {
    payload.frequency = updates.frequency;
  }
  if (goalColumnsCache.status && typeof updates.status !== 'undefined') {
    payload.status = updates.status;
  }

  const { error } = await supabaseAdmin
    .from(goalTable)
    .update(payload)
    .eq('id', goalId)
    .eq('user_id', userId);

  if (error) throw error;

  const updatedGoal = await getGoalById(goalId, userId);

  if (updatedGoal.progress_percentage >= 100 && goalColumnsCache.status) {
    await supabaseAdmin
      .from(goalTable)
      .update({ status: 'completed' })
      .eq('id', goalId)
      .eq('user_id', userId);
  }

  return getGoalById(goalId, userId);
}

export async function deleteGoal(goalId, userId) {
  const goalTable = await ensureGoalTable();
  await getGoalBaseById(goalId, userId);

  const accumulatedAmount = await getGoalAccumulatedAmount(goalId, userId);

  if (Number(accumulatedAmount) > 0) {
    throw new Error('Goal with saved funds cannot be deleted');
  }

  const { error } = await supabaseAdmin
    .from(goalTable)
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function getGoalContributions(goalId, userId) {
  await getGoalBaseById(goalId, userId);

  const table = await ensureContributionTable();
  const columns = await ensureContributionColumns();

  let query = supabaseAdmin
    .from(table)
    .select('*')
    .eq('goal_id', goalId);

  if (columns.userId) {
    query = query.eq('user_id', userId);
  }

  if (columns.date) {
    query = query.order('date', { ascending: false });
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function createGoalContribution(goalId, userId, payload) {
  await getGoalBaseById(goalId, userId);

  const table = await ensureContributionTable();
  const columns = await assertContributionAccountColumn();

  const account = await getAccountById(payload.account_id, userId);
  const currentBalance = Number(account.balance);
  const nextBalance = currentBalance - Number(payload.amount);

  if (nextBalance < 0) {
    throw new Error('Insufficient balance');
  }

  await updateAccountBalance({
    accountId: payload.account_id,
    userId,
    expectedBalance: currentBalance,
    newBalance: nextBalance
  });

  const insertPayload = {
    goal_id: goalId,
    account_id: payload.account_id,
    amount: payload.amount
  };

  if (columns.userId) {
    insertPayload.user_id = userId;
  }

  if (columns.date) {
    insertPayload.date = payload.date || today();
  }

  if (columns.description && typeof payload.description !== 'undefined') {
    insertPayload.description = payload.description;
  }

  const { data, error } = await supabaseAdmin
    .from(table)
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    await updateAccountBalance({
      accountId: payload.account_id,
      userId,
      newBalance: currentBalance
    });
    throw error;
  }

  await syncGoalStatus(goalId, userId);
  return data;
}

export async function updateGoalContribution(goalId, contributionId, userId, updates) {
  await getGoalBaseById(goalId, userId);

  const table = await ensureContributionTable();
  const columns = await assertContributionAccountColumn();

  const currentContribution = await getContributionById(contributionId, goalId, userId);

  const nextAccountId = updates.account_id || currentContribution.account_id;
  const nextAmount = Number(
    typeof updates.amount === 'number' ? updates.amount : currentContribution.amount
  );
  const currentAmount = Number(currentContribution.amount);

  if (nextAccountId === currentContribution.account_id) {
    const account = await getAccountById(nextAccountId, userId);
    const currentBalance = Number(account.balance);
    const nextBalance = currentBalance + currentAmount - nextAmount;

    if (nextBalance < 0) {
      throw new Error('Insufficient balance');
    }

    await updateAccountBalance({
      accountId: nextAccountId,
      userId,
      expectedBalance: currentBalance,
      newBalance: nextBalance
    });

    const updatePayload = {
      account_id: nextAccountId,
      amount: nextAmount
    };

    if (columns.date && Object.prototype.hasOwnProperty.call(updates, 'date')) {
      updatePayload.date = updates.date;
    }

    if (columns.description && Object.prototype.hasOwnProperty.call(updates, 'description')) {
      updatePayload.description = updates.description;
    }

    let updateQuery = supabaseAdmin
      .from(table)
      .update(updatePayload)
      .eq('id', contributionId)
      .eq('goal_id', goalId);

    if (columns.userId) {
      updateQuery = updateQuery.eq('user_id', userId);
    }

    const { data, error } = await updateQuery.select().single();

    if (error) {
      await updateAccountBalance({
        accountId: nextAccountId,
        userId,
        newBalance: currentBalance
      });
      throw error;
    }

    await syncGoalStatus(goalId, userId);
    return data;
  }

  const previousAccount = await getAccountById(currentContribution.account_id, userId);
  const newAccount = await getAccountById(nextAccountId, userId);

  const previousBalance = Number(previousAccount.balance);
  const newAccountBalance = Number(newAccount.balance);

  const previousAfterRefund = previousBalance + currentAmount;
  const newAfterCharge = newAccountBalance - nextAmount;

  if (newAfterCharge < 0) {
    throw new Error('Insufficient balance');
  }

  await updateAccountBalance({
    accountId: currentContribution.account_id,
    userId,
    expectedBalance: previousBalance,
    newBalance: previousAfterRefund
  });

  try {
    await updateAccountBalance({
      accountId: nextAccountId,
      userId,
      expectedBalance: newAccountBalance,
      newBalance: newAfterCharge
    });
  } catch (err) {
    await updateAccountBalance({
      accountId: currentContribution.account_id,
      userId,
      newBalance: previousBalance
    });
    throw err;
  }

  const updatePayload = {
    account_id: nextAccountId,
    amount: nextAmount
  };

  if (columns.date && Object.prototype.hasOwnProperty.call(updates, 'date')) {
    updatePayload.date = updates.date;
  }

  if (columns.description && Object.prototype.hasOwnProperty.call(updates, 'description')) {
    updatePayload.description = updates.description;
  }

  let updateQuery = supabaseAdmin
    .from(table)
    .update(updatePayload)
    .eq('id', contributionId)
    .eq('goal_id', goalId);

  if (columns.userId) {
    updateQuery = updateQuery.eq('user_id', userId);
  }

  const { data, error } = await updateQuery.select().single();

  if (error) {
    await updateAccountBalance({
      accountId: currentContribution.account_id,
      userId,
      newBalance: previousBalance
    });
    await updateAccountBalance({
      accountId: nextAccountId,
      userId,
      newBalance: newAccountBalance
    });
    throw error;
  }

  await syncGoalStatus(goalId, userId);
  return data;
}

export async function deleteGoalContribution(goalId, contributionId, userId) {
  await getGoalBaseById(goalId, userId);

  const table = await ensureContributionTable();
  const columns = await assertContributionAccountColumn();

  const contribution = await getContributionById(contributionId, goalId, userId);

  const account = await getAccountById(contribution.account_id, userId);
  const currentBalance = Number(account.balance);
  const nextBalance = currentBalance + Number(contribution.amount);

  await updateAccountBalance({
    accountId: contribution.account_id,
    userId,
    expectedBalance: currentBalance,
    newBalance: nextBalance
  });

  let deleteQuery = supabaseAdmin
    .from(table)
    .delete()
    .eq('id', contributionId)
    .eq('goal_id', goalId);

  if (columns.userId) {
    deleteQuery = deleteQuery.eq('user_id', userId);
  }

  const { error } = await deleteQuery;

  if (error) {
    await updateAccountBalance({
      accountId: contribution.account_id,
      userId,
      newBalance: currentBalance
    });
    throw error;
  }

  await syncGoalStatus(goalId, userId);
}
