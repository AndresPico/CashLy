import { supabaseAdmin } from './supabase.service.js';

export async function createGoal(data, userId) {
  const { data: goal, error } = await supabaseAdmin
    .from('saving_goals')
    .insert({
      ...data,
      user_id: userId
    })
    .select()
    .single();

  if (error) throw error;
  return goal;
}

export async function getGoals(userId) {
  const { data, error } = await supabaseAdmin
    .from('saving_goals_with_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function getGoalById(goalId, userId) {
  const { data, error } = await supabaseAdmin
    .from('saving_goals_with_progress')
    .select('*')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateGoal(goalId, userId, updates) {
  const { data, error } = await supabaseAdmin
    .from('saving_goals')
    .update(updates)
    .eq('id', goalId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGoal(goalId, userId) {
  const { error } = await supabaseAdmin
    .from('saving_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId);

  if (error) throw error;
}
