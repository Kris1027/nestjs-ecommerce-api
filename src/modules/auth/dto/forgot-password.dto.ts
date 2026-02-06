import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.email().transform((v) => v.toLowerCase().trim()),
});

export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}
