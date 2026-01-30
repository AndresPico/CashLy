import { supabaseAdmin  } from './supabase.service.js'

export const createAccount = async ({
  userId,
  name,
  type,
  balance
}) => {
  const { data, error } = await supabaseAdmin
    .from('accounts')
    .insert({
      user_id: userId,
      name,
      type,
      balance
    })
    .select()
    .single();

  if (error) throw error;
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

  // 🔑 CLAVE: si no hay cuentas, devolver array vacío
  return data ?? [];
}

export const getAccountById = async (id, userId) => {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

export const updateAccount = async (id, userId, updates) => {
  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteAccount = async (id, userId) => {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}
