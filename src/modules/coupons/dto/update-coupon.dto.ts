import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { decimalString } from '../../../common/utils/decimal.util';

const updateCouponSchema = z
  .object({
    code: z
      .string()
      .min(3, 'Code must be at least 3 characters')
      .max(30, 'Code must be 30 characters or less')
      .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens only')
      .transform((val) => val.toUpperCase())
      .optional(),

    description: z.string().max(500, 'Description too long').nullish(),

    // Type + value can be changed (e.g., switch from 10% to $5 flat)
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
    value: decimalString('Value').optional(),

    // Rules
    minimumOrderAmount: decimalString('Minimum order amount').nullish(),
    maximumDiscount: decimalString('Maximum discount').nullish(),
    usageLimit: z.number().int().min(1, 'Usage limit must be at least 1').nullish(),
    usageLimitPerUser: z.number().int().min(1, 'Per-user limit must be at least 1').nullish(),

    // Validity window
    validFrom: z.iso
      .datetime({ message: 'Valid from must be a valid ISO 8601 date' })
      .transform((val) => new Date(val))
      .optional(),
    validUntil: z.iso
      .datetime({ message: 'Valid until must be a valid ISO 8601 date' })
      .transform((val) => new Date(val))
      .optional(),

    isActive: z.boolean().optional(),
  })
  // Only validate date order when BOTH dates are provided in the update
  .refine((data) => !(data.validFrom && data.validUntil && data.validUntil <= data.validFrom), {
    message: 'validUntil must be after validFrom',
    path: ['validUntil'],
  })
  // Only validate percentage cap when BOTH type and value are provided
  .refine((data) => !(data.type === 'PERCENTAGE' && data.value && data.value > 100), {
    message: 'Percentage discount cannot exceed 100%',
    path: ['value'],
  });

export class UpdateCouponDto extends createZodDto(updateCouponSchema) {}
