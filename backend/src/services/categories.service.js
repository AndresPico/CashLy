import { supabaseAdmin } from './supabase.service.js';

const normalizeName = (value = '') => value.trim().toLowerCase();

const getCategoryById = async (id, userId) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new Error('Category not found');
  return data;
};

const getTransactionCountByCategoryId = async (categoryId, userId) => {
  const { count, error } = await supabaseAdmin
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('category_id', categoryId);

  if (error) throw error;
  return count || 0;
};

const ensureUniqueNameByType = async ({ userId, type, name, excludeId }) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, name, type')
    .eq('user_id', userId)
    .eq('type', type);

  if (error) throw error;

  const duplicated = (data || []).find(
    (category) =>
      category.id !== excludeId &&
      normalizeName(category.name) === normalizeName(name)
  );

  if (duplicated) {
    throw new Error('Category name already exists for this type');
  }
};

const attachTransactionCount = async (categories, userId) => {
  if (!categories?.length) return [];

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('category_id')
    .eq('user_id', userId);

  if (error) throw error;

  const countsMap = (data || []).reduce((acc, row) => {
    const categoryId = row.category_id;
    acc.set(categoryId, (acc.get(categoryId) || 0) + 1);
    return acc;
  }, new Map());

  return categories.map((category) => ({
    ...category,
    transaction_count: countsMap.get(category.id) || 0,
    status: category.is_active === false ? 'inactive' : 'active'
  }));
};

export const createCategory = async ({ userId, name, type, color, icon }) => {
  await ensureUniqueNameByType({ userId, type, name });

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({
      user_id: userId,
      name: name.trim(),
      type,
      color,
      icon
    })
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    transaction_count: 0,
    status: data.is_active === false ? 'inactive' : 'active'
  };
};

export const getCategoriesByUser = async (userId, type) => {
  let query = supabaseAdmin
    .from('categories')
    .select('*')
    .eq('user_id', userId);

  if (type) query = query.eq('type', type);

  const { data, error } = await query.order('name');

  if (error) throw error;

  return attachTransactionCount(data || [], userId);
};

export const updateCategory = async (id, userId, updates) => {
  const currentCategory = await getCategoryById(id, userId);
  const transactionCount = await getTransactionCountByCategoryId(id, userId);

  if (
    updates.type &&
    updates.type !== currentCategory.type &&
    transactionCount > 0
  ) {
    throw new Error('Cannot change type for a category with transactions');
  }

  const nextType = updates.type || currentCategory.type;
  const nextName = updates.name || currentCategory.name;

  await ensureUniqueNameByType({
    userId,
    type: nextType,
    name: nextName,
    excludeId: id
  });

  const safeUpdates = { ...updates };
  if (safeUpdates.name) {
    safeUpdates.name = safeUpdates.name.trim();
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .update(safeUpdates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    transaction_count: transactionCount,
    status: data.is_active === false ? 'inactive' : 'active'
  };
};

export const deleteCategory = async (id, userId) => {
  const transactionCount = await getTransactionCountByCategoryId(id, userId);

  if (transactionCount > 0) {
    throw new Error('Cannot delete category with associated transactions');
  }

  const { error } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
};
