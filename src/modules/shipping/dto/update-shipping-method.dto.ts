import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { decimalString } from '../../../common/utils/decimal.util';

const updateShippingMethodSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or less')
    .trim()
    .optional(),

  description: z.string().max(500, 'Description too long').nullish(),

  basePrice: decimalString('Base price').optional(),

  // nullish allows explicitly setting to null (removing free shipping)
  freeShippingThreshold: decimalString('Free shipping threshold').nullish(),

  estimatedDays: z
    .string()
    .min(1, 'Estimated days is required')
    .max(50, 'Estimated days must be 50 characters or less')
    .trim()
    .optional(),

  sortOrder: z.number().int().min(0).optional(),

  isActive: z.boolean().optional(),
});

export class UpdateShippingMethodDto extends createZodDto(updateShippingMethodSchema) {}
