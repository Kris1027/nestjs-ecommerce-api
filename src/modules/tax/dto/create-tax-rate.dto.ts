import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Tax rate schema for creating a new rate
const createTaxRateSchema = z.object({
  // Human-readable name for the rate
  name: z.string().min(1, 'Name is required').max(100),

  // Rate as decimal: 0.23 = 23%, stored as Decimal(5,4) in DB
  // Allows rates from 0% to 99.99%
  rate: z
    .string()
    .regex(/^\d+(\.\d{1,4})?$/, 'Rate must be a decimal number with up to 4 decimal places')
    .refine((val) => {
      const num = parseFloat(val);
      return num >= 0 && num < 1;
    }, 'Rate must be between 0 and 0.9999 (0% to 99.99%)'),

  // Whether this is the default rate for new orders
  isDefault: z.boolean().optional().default(false),
});

export class CreateTaxRateDto extends createZodDto(createTaxRateSchema) {}
