import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Schema defines validation rules for refund request input
const requestRefundSchema = z.object({
  // Reason must be descriptive enough for admin review
  // Min 10 chars prevents "refund pls", max 1000 prevents abuse
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason must not exceed 1000 characters'),
});

// createZodDto generates a class that NestJS can use for validation
// It integrates with our global ZodValidationPipe
export class RequestRefundDto extends createZodDto(requestRefundSchema) {}
