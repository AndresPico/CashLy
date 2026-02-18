import { z } from 'zod';

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date');
const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format (YYYY-MM)');

export const createBudgetSchema = z.object({
  category_id: z.string().uuid(),
  amount: z.number().int('Amount must be an integer (no decimals)').positive(),
  period: z.enum(['monthly']).default('monthly'),
  month: monthSchema.optional(),
  period_start: isoDateSchema.optional(),
  period_end: isoDateSchema.optional()
}).superRefine((value, ctx) => {
  const hasMonth = Boolean(value.month);
  const hasRange = Boolean(value.period_start && value.period_end);

  if (!hasMonth && !hasRange) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Provide month or period_start/period_end'
    });
  }
});

export const updateBudgetSchema = z
  .object({
    amount: z
      .number()
      .int('Amount must be an integer (no decimals)')
      .positive()
      .optional(),
    period: z.enum(['monthly']).optional(),
    month: monthSchema.optional(),
    period_start: isoDateSchema.optional(),
    period_end: isoDateSchema.optional()
  })
  .superRefine((value, ctx) => {
    const hasStart = Boolean(value.period_start);
    const hasEnd = Boolean(value.period_end);

    if (hasStart !== hasEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'period_start and period_end must be provided together'
      });
    }
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  });

export const budgetsQuerySchema = z.object({
  month: monthSchema.optional()
});
