import { supabaseAdmin } from './supabase.service.js';

export const createCategory = async ({ userId, name, type, color, icon }) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({
      user_id: userId,
      name,
      type,
      color,
      icon
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getCategoriesByUser = async (userId, type) => {
  let query = supabaseAdmin
    .from('categories')
    .select('*')
    .eq('user_id', userId);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query.order('name');

  if (error) throw error;
  return data;
};

export const updateCategory = async (id, userId, updates) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCategory = async (id, userId) => {
  const { error } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
};
