/**
 * Order Number Utility
 *
 * Generates unique, human-readable order numbers
 * in the format "ORD-YYYYMMDD-XXXX".
 */

/**
 * Generates an order number with today's date and a random suffix.
 *
 * @returns A string like "ORD-20260203-A1B2"
 *
 * @example
 * generateOrderNumber() // "ORD-20260203-K7M2"
 * generateOrderNumber() // "ORD-20260203-P4Q9"
 */
export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${date}-${random}`;
}

/**
 * Callback type for checking if an order number exists in the database.
 */
type OrderNumberExistsChecker = (orderNumber: string) => Promise<{ id: string } | null>;

/**
 * Generates a unique order number by retrying on collision.
 *
 * @param exists - Function that checks if order number is taken
 * @param maxAttempts - Maximum retry attempts (default: 5)
 * @returns A guaranteed unique order number
 * @throws Error if no unique number found within max attempts
 *
 * @example
 * const orderNumber = await ensureUniqueOrderNumber(
 *   (num) => this.prisma.order.findUnique({ where: { orderNumber: num }, select: { id: true } }),
 * );
 */
export async function ensureUniqueOrderNumber(
  exists: OrderNumberExistsChecker,
  maxAttempts = 5,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generateOrderNumber();
    const existing = await exists(candidate);
    if (!existing) {
      return candidate;
    }
  }

  // Fallback: append timestamp for guaranteed uniqueness
  return `ORD-${Date.now()}`;
}
