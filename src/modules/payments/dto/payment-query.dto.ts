import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationQuerySchema } from '../../../common/dto/pagination.dto';

// Extend shared pagination with payment-specific status filter
const paymentQuerySchema = PaginationQuerySchema.extend({
  status: z
    .enum(['PENDING', 'SUCCEEDED', 'FAILED', 'REFUND_PENDING', 'REFUNDED', 'PARTIALLY_REFUNDED'])
    .optional(),
});

export class PaymentQueryDto extends createZodDto(paymentQuerySchema) {}

export type PaymentQuery = z.infer<typeof paymentQuerySchema>;
