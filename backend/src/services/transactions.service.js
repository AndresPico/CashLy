import { supabaseAdmin } from './supabase.service.js';

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
  // 1️⃣ Obtener cuenta
  const { data: account, error: accError } = await supabaseAdmin
    .from('accounts')
    .select('id, balance')
    .eq('id', account_id)
    .eq('user_id', userId)
    .single();

  if (accError) throw new Error('Account not found');

  // 2️⃣ Calcular nuevo balance
  const newBalance =
    type === 'income'
      ? Number(account.balance) + amount
      : Number(account.balance) - amount;

  if (newBalance < 0) {
    throw new Error('Insufficient balance');
  }

  // 3️⃣ Crear transacción
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

  if (trxError) throw trxError;

  // 4️⃣ Actualizar balance
  const { error: balError } = await supabaseAdmin
    .from('accounts')
    .update({ balance: newBalance })
    .eq('id', account_id)
    .eq('user_id', userId);

  if (balError) throw balError;

  return transaction;
};

/**
 * READ ALL
 */
export const getTransactionsByUser = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select(`
      *,
      accounts(name),
      categories(name, color)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
};
