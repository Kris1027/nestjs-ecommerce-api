import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Checkout DTO - intentionally minimal
// Cart items and prices are read server-side (never trust the client with prices)
const createOrderSchema = z.object({
  // ID of a saved address from the user's address book
  shippingAddressId: z.cuid('Invalid address ID'),

  // Optional delivery instructions
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

export class CreateOrderDto extends createZodDto(createOrderSchema) {}
