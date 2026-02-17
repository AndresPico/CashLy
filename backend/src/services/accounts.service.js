import { supabaseAdmin } from './supabase.service.js';

export const createAccount = async (accountData) => {
  console.log('🚀 [createAccount] Iniciando...');
  console.log('🔍 [createAccount] accountData completo:', accountData);
  console.log('🔍 [createAccount] ¿Tiene userId?:', 'userId' in accountData);
  console.log('🔍 [createAccount] userId:', accountData.userId);
  console.log('🔍 [createAccount] ¿Tiene bank_name?:', 'bank_name' in accountData);
  console.log('🔍 [createAccount] bank_name:', accountData.bank_name);
  
  // Validar que tenemos userId
  if (!accountData.userId) {
    console.error('❌ [createAccount] ERROR: userId no proporcionado');
    throw new Error('UserId es requerido para crear una cuenta');
  }

  const insertData = {
    user_id: accountData.userId,
    name: accountData.name,
    type: accountData.type,
    balance: accountData.balance
  };

  if (accountData.bank_name !== undefined) {
    insertData.bank_name = accountData.bank_name;
    console.log('✅ [createAccount] bank_name agregado:', accountData.bank_name);
  }
  
  console.log('📤 [createAccount] Datos para insertar:', insertData);
  
  const { data, error } = await supabaseAdmin
    .from('accounts')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('❌ [createAccount] Error Supabase:', error);
    throw error;
  }
  
  console.log('✅ [createAccount] Éxito:', data);
  return data;
};

export async function getAccountsByUser(userId) {
  const { data, error } = await supabaseAdmin
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export const getAccountById = async (id, userId) => {
  const { data, error } = await supabaseAdmin
    .from('accounts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export const updateAccount = async (accountId, userId, accountData) => {
  const updateData = {};

  if (Object.prototype.hasOwnProperty.call(accountData, 'name')) {
    updateData.name = accountData.name;
  }
  if (Object.prototype.hasOwnProperty.call(accountData, 'type')) {
    updateData.type = accountData.type;
    if (accountData.type !== 'bank' && !Object.prototype.hasOwnProperty.call(accountData, 'bank_name')) {
      updateData.bank_name = null;
    }
  }
  if (Object.prototype.hasOwnProperty.call(accountData, 'balance')) {
    updateData.balance = accountData.balance;
  }
  if (Object.prototype.hasOwnProperty.call(accountData, 'bank_name')) {
    updateData.bank_name = accountData.bank_name ?? null;
  }

  const { data, error } = await supabaseAdmin
    .from('accounts')
    .update(updateData)
    .eq('id', accountId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteAccount = async (id, userId) => {
  const { data, error } = await supabaseAdmin
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const notFoundError = new Error('Account not found or not owned by user');
    notFoundError.code = 'ACCOUNT_NOT_FOUND';
    throw notFoundError;
  }

  return data;
};
