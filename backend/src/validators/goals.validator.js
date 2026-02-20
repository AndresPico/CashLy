import { z } from 'zod';

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date');

export const createGoalSchema = z.object({
  name: z.string().min(1),
  account_id: z.string().uuid().optional(),
  target_amount: z
    .number()
    .int('Target amount must be an integer (no decimals)')
    .positive(),
  start_date: isoDateSchema.optional(),
  target_date: isoDateSchema.optional(),
  frequency: z.string().min(1).default('monthly'),
  description: z.string().max(255).optional(),
  status: z.enum(['active', 'paused']).default('active')
});

export const updateGoalSchema = z
  .object({
    name: z.string().min(1).optional(),
    target_amount: z
      .number()
      .int('Target amount must be an integer (no decimals)')
      .positive()
      .optional(),
    target_date: isoDateSchema.optional(),
    frequency: z.string().min(1).optional(),
    description: z.string().max(255).optional(),
    status: z.enum(['active', 'paused']).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  });

export const createGoalContributionSchema = z.object({
  account_id: z.string().uuid(),
  amount: z
    .number()
    .int('Amount must be an integer (no decimals)')
    .positive('Amount must be greater than zero'),
  description: z.string().max(255).optional(),
  date: isoDateSchema.optional()
});

export const updateGoalContributionSchema = z
  .object({
    account_id: z.string().uuid().optional(),
    amount: z
      .number()
      .int('Amount must be an integer (no decimals)')
      .positive('Amount must be greater than zero')
      .optional(),
    description: z.string().max(255).optional(),
    date: isoDateSchema.optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  });
