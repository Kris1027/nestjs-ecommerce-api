// Event emitted when product stock falls below lowStockThreshold
// Sent to ALL admin users (operational alert, not user-specific)
export class LowStockEvent {
  constructor(
    public readonly productId: string, // Reference for notification
    public readonly productName: string, // For email/notification display
    public readonly currentStock: number, // Available stock after adjustment
    public readonly threshold: number, // The configured lowStockThreshold
  ) {}
}
