import { supabaseAdmin } from './supabase.service.js';

export async function createBudget(data, userId) {
  const { data: budget, error } = await supabaseAdmin
    .from('budgets')
    .insert({
      ...data,
      user_id: userId
    })
    .select()
    .single();

  if (error) throw error;
  return budget;
}

export async function getBudgets(userId) {
  const { data, error } = await supabaseAdmin
    .from('budgets_with_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function getBudgetById(id, userId) {
  const { data, error } = await supabaseAdmin
    .from('budgets_with_progress')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateBudget(id, userId, updates) {
  const { data, error } = await supabaseAdmin
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBudget(id, userId) {
  const { error } = await supabaseAdmin
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}
