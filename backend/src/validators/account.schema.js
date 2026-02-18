import { z } from 'zod';

const accountBaseSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),

  type: z.enum(['cash', 'bank', 'credit', 'savings', 'investment', 'other']),

  balance: z
    .number()
    .int('Balance must be an integer (no decimals)')
    .min(0, 'Balance cannot be negative')
    .optional(),

  bank_name: z
    .string()
    .max(100, 'Bank name too long')
    .nullable()
    .optional()
});

const normalizeBankName = (data, defaultNull = false) => {
  const normalized = { ...data };
  const hasBankName = Object.prototype.hasOwnProperty.call(data, 'bank_name');

  if (hasBankName) {
    normalized.bank_name = data.bank_name ?? null;
  } else if (defaultNull) {
    normalized.bank_name = null;
  }

  return normalized;
};

export const accountCreateSchema = accountBaseSchema.transform((data) =>
  normalizeBankName(data, true)
);

export const accountUpdateSchema = accountBaseSchema
  .partial()
  .transform((data) => normalizeBankName(data, false));
