import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Customer sends just the order ID — amount comes from the order in the database
// Never trust the client to send the payment amount
const createPaymentIntentSchema = z.object({
  orderId: z.cuid('Invalid order ID'),
});

export class CreatePaymentIntentDto extends createZodDto(createPaymentIntentSchema) {}
