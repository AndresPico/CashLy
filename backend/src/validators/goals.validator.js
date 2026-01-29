import { z } from 'zod';

export const createGoalSchema = z.object({
  name: z.string().min(1),
  account_id: z.string().uuid(),
  target_amount: z.number().positive(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

export const updateGoalSchema = z.object({
  name: z.string().min(1).optional(),
  target_amount: z.number().positive().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});
