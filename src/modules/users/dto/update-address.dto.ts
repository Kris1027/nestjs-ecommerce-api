import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const updateAddressSchema = z.object({
  type: z.enum(['SHIPPING', 'BILLING']).optional(),
  isDefault: z.boolean().optional(),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name too long')
    .optional(),
  phone: z
    .string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(15, 'Phone number too long')
    .optional(),
  street: z
    .string()
    .min(3, 'Street address must be at least 3 characters')
    .max(200, 'Street address too long')
    .optional(),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City too long')
    .optional(),
  region: z.string().max(100, 'Region too long').nullish(),
  postalCode: z
    .string()
    .min(3, 'Postal code must be at least 3 characters')
    .max(20, 'Postal code too long')
    .optional(),
  country: z.string().length(2, 'Country must be a 2-letter ISO code').optional(),
});

export class UpdateAddressDto extends createZodDto(updateAddressSchema) {}
