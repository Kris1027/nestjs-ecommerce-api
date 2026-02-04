import { z } from 'zod';

/**
 * Validates a string represents a decimal number (e.g., "9.99", "100")
 * and transforms it to a float. Used for price/money fields sent as JSON strings.
 */
export const decimalString = (field: string): z.ZodType<number> =>
  z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, `${field} must be a valid amount (e.g., 99.99)`)
    .transform((val) => parseFloat(val));
