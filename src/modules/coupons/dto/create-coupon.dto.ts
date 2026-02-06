import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { decimalString } from '../../../common/utils/decimal.util';

const createCouponSchema = z
  .object({
    // Coupon code - what customers type at checkout
    // Uppercase alphanumeric + hyphens, 3-30 chars
    code: z
      .string()
      .min(3, 'Code must be at least 3 characters')
      .max(30, 'Code must be 30 characters or less')
      .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens only')
      .transform((val) => val.toUpperCase()),

    // Internal admin note (not shown to customers)
    description: z.string().max(500, 'Description too long').optional(),

    // Discount type determines how "value" is interpreted
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),

    // The discount value: 10.00 = "10% off" or "$10 off" depending on type
    value: decimalString('Value'),

    // Rules
    minimumOrderAmount: decimalString('Minimum order amount').optional(),
    maximumDiscount: decimalString('Maximum discount').optional(),
    usageLimit: z.number().int().min(1, 'Usage limit must be at least 1').optional(),
    usageLimitPerUser: z.number().int().min(1, 'Per-user limit must be at least 1').optional(),

    // Validity window - ISO date strings
    validFrom: z.iso
      .datetime({ message: 'Valid from must be a valid ISO 8601 date' })
      .transform((val) => new Date(val)),
    validUntil: z.iso
      .datetime({ message: 'Valid until must be a valid ISO 8601 date' })
      .transform((val) => new Date(val)),

    isActive: z.boolean().default(true),
  })
  // Cross-field validations using .refine()
  .refine((data) => data.validUntil > data.validFrom, {
    message: 'validUntil must be after validFrom',
    path: ['validUntil'],
  })
  .refine((data) => !(data.type === 'PERCENTAGE' && data.value > 100), {
    message: 'Percentage discount cannot exceed 100%',
    path: ['value'],
  });

export class CreateCouponDto extends createZodDto(createCouponSchema) {}
