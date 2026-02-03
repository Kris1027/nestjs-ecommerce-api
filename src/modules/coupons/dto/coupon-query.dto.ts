import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationQuerySchema } from '../../../common/dto/pagination.dto';

const couponQuerySchema = PaginationQuerySchema.extend({
  // Filter by active status: "true" or "false"
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),

  // Filter by coupon type
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),

  // Filter coupons valid right now (not expired, started)
  validNow: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export class CouponQueryDto extends createZodDto(couponQuerySchema) {}

export type CouponQuery = z.infer<typeof couponQuerySchema>;
