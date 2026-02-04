import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { decimalString } from '../../../common/utils/decimal.util';

const createShippingMethodSchema = z.object({
  // Display name shown to customers at checkout
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or less')
    .trim(),

  // Optional internal description for admin reference
  description: z.string().max(500, 'Description too long').optional(),

  // Flat-rate shipping cost (e.g., "9.99")
  basePrice: decimalString('Base price'),

  // Orders above this amount get free shipping (null = never free)
  freeShippingThreshold: decimalString('Free shipping threshold').optional(),

  // Human-readable delivery estimate shown to customers
  estimatedDays: z
    .string()
    .min(1, 'Estimated days is required')
    .max(50, 'Estimated days must be 50 characters or less')
    .trim(),

  // Controls display order in the shipping method list
  sortOrder: z.number().int().min(0).default(0),

  // Whether this method is available for selection
  isActive: z.boolean().default(true),
});

export class CreateShippingMethodDto extends createZodDto(createShippingMethodSchema) {}
