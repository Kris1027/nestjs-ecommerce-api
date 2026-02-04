import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Checkout DTO - intentionally minimal
// Cart items and prices are read server-side (never trust the client with prices)
const createOrderSchema = z.object({
  // ID of a saved address from the user's address book
  shippingAddressId: z.cuid('Invalid address ID'),

  // ID of the chosen shipping method (from GET /shipping/methods)
  shippingMethodId: z.cuid('Invalid shipping method ID'),

  // Optional coupon code to apply discount
  couponCode: z
    .string()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(30, 'Coupon code must be 30 characters or less')
    .transform((val) => val.toUpperCase())
    .optional(),

  // Optional delivery instructions
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

export class CreateOrderDto extends createZodDto(createOrderSchema) {}
