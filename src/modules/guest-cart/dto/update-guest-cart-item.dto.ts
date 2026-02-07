import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const updateGuestCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export class UpdateGuestCartItemDto extends createZodDto(updateGuestCartItemSchema) {}
