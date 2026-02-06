import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const applyCouponSchema = z.object({
  // Coupon codes are typically uppercase alphanumeric
  code: z
    .string()
    .min(1, 'Coupon code is required')
    .max(50, 'Coupon code is too long')
    .transform((val) => val.toUpperCase().trim()), // Normalize to uppercase
});

export class ApplyCouponDto extends createZodDto(applyCouponSchema) {}
