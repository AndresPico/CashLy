import { supabaseAdmin  } from './supabase.service.js'

export const createAccount = async ({ userId, name, type, balance, currency }) => {
  const { data, error } = await supabaseAdmin
    .from('accounts')
    .insert({
      user_id: userId,
      name,
      type,
      balance,
      currency
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const getAccountsByUser = async (userId) => {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return data
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
