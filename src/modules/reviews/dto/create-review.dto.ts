import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Schema defines the shape and validation rules for creating a review
const createReviewSchema = z.object({
  // Rating must be a whole number from 1 to 5 (star rating)
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),

  // Optional short headline like "Great product!" or "Disappointing quality"
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be 100 characters or less')
    .optional(),

  // Required review body — minimum length ensures meaningful content
  comment: z
    .string()
    .min(10, 'Comment must be at least 10 characters')
    .max(2000, 'Comment must be 2000 characters or less'),
});

// createZodDto bridges Zod schema → NestJS DTO class (used by validation pipe)
export class CreateReviewDto extends createZodDto(createReviewSchema) {}
