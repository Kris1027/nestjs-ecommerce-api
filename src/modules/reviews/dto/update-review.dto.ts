import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const updateReviewSchema = z
  .object({
    // Same validations as create, but all optional
    rating: z
      .number()
      .int('Rating must be a whole number')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating must be at most 5')
      .optional(),

    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must be 100 characters or less')
      // nullish = optional OR null (allows removing the title)
      .nullish(),

    comment: z
      .string()
      .min(10, 'Comment must be at least 10 characters')
      .max(2000, 'Comment must be 2000 characters or less')
      .optional(),
  })
  // Ensure at least one field is provided — empty updates waste a DB call
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });

export class UpdateReviewDto extends createZodDto(updateReviewSchema) {}
