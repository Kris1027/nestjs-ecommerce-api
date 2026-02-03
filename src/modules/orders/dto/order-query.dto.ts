import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationQuerySchema } from '../../../common/dto/pagination.dto';

// Extend pagination with order-specific filters
const orderQuerySchema = PaginationQuerySchema.extend({
  // Filter by order status (e.g., ?status=PENDING)
  status: z
    .enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .optional(),

  // Date range filters (ISO 8601 strings from query params)
  fromDate: z.iso.datetime({ error: 'Invalid date format. Use ISO 8601' }).optional(),
  toDate: z.iso.datetime({ error: 'Invalid date format. Use ISO 8601' }).optional(),
});

export class OrderQueryDto extends createZodDto(orderQuerySchema) {}

// Export inferred type for use in the service layer
export type OrderQuery = z.infer<typeof orderQuerySchema>;
