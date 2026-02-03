import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const updateOrderStatusSchema = z.object({
  // The new status to transition to
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),

  // Internal note visible only to admins (e.g., "Customer called to confirm")
  adminNotes: z.string().max(1000, 'Admin notes must be 1000 characters or less').optional(),
});

export class UpdateOrderStatusDto extends createZodDto(updateOrderStatusSchema) {}
