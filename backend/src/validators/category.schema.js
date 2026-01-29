import { z } from 'zod';

export const categoryCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name too long'),

  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Invalid category type' })
  }),

  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, 'Invalid hex color'),

  icon: z.string().max(50).optional()
});

export const categoryUpdateSchema = categoryCreateSchema.partial();
