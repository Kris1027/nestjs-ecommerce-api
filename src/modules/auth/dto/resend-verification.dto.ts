import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const resendVerificationSchema = z.object({
  email: z.email().transform((v) => v.toLowerCase().trim()),
});

export class ResendVerificationDto extends createZodDto(resendVerificationSchema) {}
