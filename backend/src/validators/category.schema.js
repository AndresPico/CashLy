import { z } from 'zod';

export const categoryCreateSchema = z.object({
  name: z
    .string()
    .trim()
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

export const categoryUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    type: z.enum(['income', 'expense']).optional(),
    color: z.string().regex(/^#([0-9A-Fa-f]{6})$/, 'Invalid hex color').optional(),
    icon: z.string().max(50).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  });

export const categoryQuerySchema = z.object({
  type: z.enum(['income', 'expense']).optional()
});
