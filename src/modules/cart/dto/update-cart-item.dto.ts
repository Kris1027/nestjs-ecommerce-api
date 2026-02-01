import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const updateCartItemSchema = z.object({
  quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1'),
});

export class UpdateCartItemDto extends createZodDto(updateCartItemSchema) {}
