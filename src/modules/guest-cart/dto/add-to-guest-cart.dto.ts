import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const addToGuestCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
});

export class AddToGuestCartDto extends createZodDto(addToGuestCartSchema) {}
