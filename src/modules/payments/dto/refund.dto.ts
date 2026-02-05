import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { decimalString } from '../../../common/utils/decimal.util';

// Both fields optional: no amount = full refund, no reason = no explanation stored
const refundSchema = z.object({
  amount: decimalString('Refund amount').optional(),
  reason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
});

export class RefundDto extends createZodDto(refundSchema) {}
