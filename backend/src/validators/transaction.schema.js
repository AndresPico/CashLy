import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date');
const todayAsIsoDate = () => new Date().toISOString().slice(0, 10);

export const transactionCreateSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid(),

  type: z.enum(['income', 'expense']),

  amount: z
    .number()
    .int('Amount must be an integer (no decimals)')
    .positive('Amount must be greater than zero'),

  description: z.string().max(255).optional(),

  date: dateSchema.default(todayAsIsoDate)
});

export const transactionUpdateSchema = z
  .object({
    category_id: z.string().uuid().optional(),
    type: z.enum(['income', 'expense']).optional(),
    amount: z
      .number()
      .int('Amount must be an integer (no decimals)')
      .positive('Amount must be greater than zero')
      .optional(),
    description: z.string().max(255).optional(),
    date: dateSchema.optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  });

export const transactionQuerySchema = z
  .object({
    account_id: z.string().uuid().optional(),
    category_id: z.string().uuid().optional(),
    type: z.enum(['income', 'expense']).optional(),
    date: dateSchema.optional(),
    date_from: dateSchema.optional(),
    date_to: dateSchema.optional()
  })
  .refine(
    (value) =>
      !value.date_from || !value.date_to || value.date_from <= value.date_to,
    {
      message: 'date_from must be less than or equal to date_to'
    }
  );
