import { z } from 'zod';

export const transactionCreateSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid(),

  type: z.enum(['income', 'expense']),

  amount: z
    .number()
    .positive('Amount must be greater than zero'),

  description: z.string().max(255).optional(),

  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
});

export const transactionUpdateSchema = transactionCreateSchema.partial();
