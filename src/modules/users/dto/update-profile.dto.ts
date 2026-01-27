import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name cannot be empty')
    .max(50, 'First name too long')
    .optional(),
  lastName: z.string().min(1, 'Last name cannot be empty').max(50, 'Last name too long').optional(),
});

export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}

export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
