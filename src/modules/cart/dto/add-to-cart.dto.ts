import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const addToCartSchema = z.object({
  productId: z.cuid('Invalid product ID'),

  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .default(1),
});

export class AddToCartDto extends createZodDto(addToCartSchema) {}
