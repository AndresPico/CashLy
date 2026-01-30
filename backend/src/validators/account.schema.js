import { z } from 'zod';

export const accountCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),

  type: z.enum(['cash', 'bank', 'credit', 'savings']),

  balance: z
    .number()
    .min(0, 'Balance cannot be negative')
    .optional(),

  currency: z
    .string()
    .length(3, 'Currency must be ISO 4217')
    .default('COP')
});

export const accountUpdateSchema = accountCreateSchema.partial();
