import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().length(64, 'Invalid reset token'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must not exceed 72 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number',
    ),
});

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
