import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PaginationQuerySchema } from '../../../common/dto/pagination.dto';

// Extend shared pagination with review-specific filters
const reviewQuerySchema = PaginationQuerySchema.extend({
  // Filter by moderation status (admin use: see pending reviews)
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),

  // Filter by star rating (e.g., "show me all 5-star reviews")
  // Query params arrive as strings, so transform to number
  rating: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(5))
    .optional(),
});

export class ReviewQueryDto extends createZodDto(reviewQuerySchema) {}

// Export the inferred type for use in service method signatures
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;
