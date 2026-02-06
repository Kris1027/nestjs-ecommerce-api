import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// All fields optional for partial updates
const updateTaxRateSchema = z.object({
  name: z.string().min(1).max(100).optional(),

  rate: z
    .string()
    .regex(/^\d+(\.\d{1,4})?$/, 'Rate must be a decimal number with up to 4 decimal places')
    .refine((val) => {
      const num = parseFloat(val);
      return num >= 0 && num < 1;
    }, 'Rate must be between 0 and 0.9999 (0% to 99.99%)')
    .optional(),

  isDefault: z.boolean().optional(),

  isActive: z.boolean().optional(),
});

export class UpdateTaxRateDto extends createZodDto(updateTaxRateSchema) {}
