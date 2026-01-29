import { z } from 'zod';

export const createBudgetSchema = z.object({
  category_id: z.string().uuid(),
  amount: z.number().positive(),
  period: z.enum(['weekly', 'monthly']),
  period_start: z.string(),
  period_end: z.string()
});

export const updateBudgetSchema = z.object({
  amount: z.number().positive().optional(),
  period_start: z.string().optional(),
  period_end: z.string().optional()
});
