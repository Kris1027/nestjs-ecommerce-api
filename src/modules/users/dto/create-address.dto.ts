import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const createAddressSchema = z.object({
  type: z.enum(['SHIPPING', 'BILLING']).default('SHIPPING'),
  isDefault: z.boolean().default(false),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name too long'),
  phone: z
    .string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(15, 'Phone number too long'),
  street: z
    .string()
    .min(3, 'Street address must be at least 3 characters')
    .max(200, 'Street address too long'),
  city: z.string().min(2, 'City must be at least 2 characters').max(100, 'City too long'),
  region: z.string().max(100, 'Region too long').optional(),
  postalCode: z
    .string()
    .min(3, 'Postal code must be at least 3 characters')
    .max(20, 'Postal code too long'),
  country: z.string().length(2, 'Country must be a 2-letter ISO code').default('PL'),
});

export class CreateAddressDto extends createZodDto(createAddressSchema) {}
