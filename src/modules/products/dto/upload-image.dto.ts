import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Validates the optional alt text sent alongside a file upload
const uploadImageSchema = z.object({
  alt: z
    .string()
    .trim() // strip leading/trailing whitespace
    .max(200, 'Alt text must be 200 characters or less')
    .optional(), // alt text is nice-to-have, not required
});

export class UploadImageDto extends createZodDto(uploadImageSchema) {}
