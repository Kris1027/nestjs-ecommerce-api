import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const adminUpdateReviewSchema = z.object({
  // Admin can only approve or reject — PENDING is not a valid moderation action
  status: z.enum(['APPROVED', 'REJECTED'], {
    message: 'Status must be APPROVED or REJECTED',
  }),

  // Optional explanation — especially useful when rejecting ("violates guidelines")
  adminNote: z.string().max(500, 'Admin note must be 500 characters or less').nullish(),
});

export class AdminUpdateReviewDto extends createZodDto(adminUpdateReviewSchema) {}
