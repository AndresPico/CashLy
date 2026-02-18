import { supabaseAdmin } from './supabase.service.js';

const getSignedImpact = (type, amount) =>
  type === 'income' ? Number(amount) : -Number(amount);

const updateAccountBalance = async ({
  accountId,
  userId,
  expectedBalance,
  newBalance
}) => {
  let query = supabaseAdmin
    .from('accounts')
    .update({ balance: Number(newBalance) })
    .eq('id', accountId)
    .eq('user_id', userId);

  if (typeof expectedBalance === 'number') {
    query = query.eq('balance', Number(expectedBalance));
  }

  const { data, error } = await query.select('id, balance').single();

  if (error) throw error;

  return data;
};

const getAccountById = async (accountId, userId) => {
  const { data: account, error } = await supabaseAdmin
    .from('accounts')
    .select('id, balance')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single();

  if (error || !account) throw new Error('Account not found');
  return account;
};

const getTransactionById = async (transactionId, userId) => {
  const { data: transaction, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('user_id', userId);

  if (error || !transaction || transaction.length === 0) {
    throw new Error('Transaction not found');
  }

  return transaction[0];
};

const getCategoryById = async (categoryId, userId) => {
  const { data: category, error } = await supabaseAdmin
    .from('categories')
    .select('id, type')
    .eq('id', categoryId)
    .eq('user_id', userId)
    .single();

  if (error || !category) throw new Error('Category not found');
  return category;
};

/**
 * CREATE TRANSACTION + UPDATE BALANCE
 */
export const createTransaction = async ({
  userId,
  account_id,
  category_id,
  type,
  amount,
  description,
  date
}) => {
  const account = await getAccountById(account_id, userId);
  const category = await getCategoryById(category_id, userId);
  const currentBalance = Number(account.balance);
  const newBalance = currentBalance + getSignedImpact(type, amount);

  if (category.type !== type) {
    throw new Error('Category type does not match transaction type');
  }

  if (newBalance < 0) throw new Error('Insufficient balance');

  await updateAccountBalance({
    accountId: account_id,
    userId,
    expectedBalance: currentBalance,
    newBalance
  });

  const { data: transaction, error: trxError } = await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: userId,
      account_id,
      category_id,
      type,
      amount,
      description,
      date
    })
    .select()
    .single();

  if (trxError) {
    await updateAccountBalance({
      accountId: account_id,
      userId,
      newBalance: currentBalance
    });
    throw trxError;
  }

  return transaction;
};

/**
 * READ ALL
 */
export const getTransactionsByUser = async (userId, filters = {}) => {
  let query = supabaseAdmin
    .from('transactions')
    .select(`
      *,
      accounts(name),
      categories(name)
    `)
    .eq('user_id', userId);

  if (filters.account_id) query = query.eq('account_id', filters.account_id);
  if (filters.category_id) query = query.eq('category_id', filters.category_id);
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.date) query = query.eq('date', filters.date);
  if (filters.date_from) query = query.gte('date', filters.date_from);
  if (filters.date_to) query = query.lte('date', filters.date_to);

  const { data, error } = await query
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * UPDATE TRANSACTION + REBALANCE ACCOUNT
 */
export const updateTransaction = async (transactionId, userId, updates) => {
  const currentTransaction = await getTransactionById(transactionId, userId);
  const account = await getAccountById(currentTransaction.account_id, userId);
  const currentBalance = Number(account.balance);

  const previousImpact = getSignedImpact(
    currentTransaction.type,
    currentTransaction.amount
  );
  const nextType = updates.type ?? currentTransaction.type;
  const nextAmount = updates.amount ?? Number(currentTransaction.amount);
  const nextCategoryId = updates.category_id ?? currentTransaction.category_id;
  const nextCategory = await getCategoryById(nextCategoryId, userId);
  const nextImpact = getSignedImpact(nextType, nextAmount);
  const newBalance = currentBalance - previousImpact + nextImpact;

  if (nextCategory.type !== nextType) {
    throw new Error('Category type does not match transaction type');
  }

  if (newBalance < 0) throw new Error('Insufficient balance');

  await updateAccountBalance({
    accountId: currentTransaction.account_id,
    userId,
    expectedBalance: currentBalance,
    newBalance
  });

  const { data: transaction, error } = await supabaseAdmin
    .from('transactions')
    .update(updates)
    .eq('id', transactionId)
    .eq('user_id', userId)
    .select(`
      *,
      accounts(name),
      categories(name)
    `)
    .single();

  if (error) {
    await updateAccountBalance({
      accountId: currentTransaction.account_id,
      userId,
      newBalance: currentBalance
    });
    throw error;
  }

  return transaction;
};

/**
 * DELETE TRANSACTION + REBALANCE ACCOUNT
 */
export const deleteTransaction = async (transactionId, userId) => {
  const currentTransaction = await getTransactionById(transactionId, userId);
  const account = await getAccountById(currentTransaction.account_id, userId);
  const currentBalance = Number(account.balance);

  const currentImpact = getSignedImpact(
    currentTransaction.type,
    currentTransaction.amount
  );
  const newBalance = currentBalance - currentImpact;

  if (newBalance < 0) throw new Error('Insufficient balance');

  await updateAccountBalance({
    accountId: currentTransaction.account_id,
    userId,
    expectedBalance: currentBalance,
    newBalance
  });

  const { error } = await supabaseAdmin
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', userId);

  if (error) {
    await updateAccountBalance({
      accountId: currentTransaction.account_id,
      userId,
      newBalance: currentBalance
    });
    throw error;
  }
};
