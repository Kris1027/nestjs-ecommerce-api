// Event emitted after a new order is created via checkout
export class OrderCreatedEvent {
  constructor(
    public readonly userId: string, // Who placed the order
    public readonly userEmail: string, // Where to send the email
    public readonly userFirstName: string | null, // For email greeting
    public readonly orderId: string, // Reference for in-app notification
    public readonly orderNumber: string, // Human-readable "ORD-20260205-XXXX"
    public readonly total: string, // Pre-formatted decimal string
  ) {}
}

// Event emitted when admin changes order status (SHIPPED, DELIVERED, CANCELLED)
export class OrderStatusChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly userEmail: string,
    public readonly userFirstName: string | null,
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly newStatus: string, // The status it changed TO
  ) {}
}

// Event emitted when a customer submits a refund request
export class RefundRequestCreatedEvent {
  constructor(
    public readonly userId: string, // Customer who requested
    public readonly userEmail: string, // Customer email for notification
    public readonly userFirstName: string | null, // For email greeting
    public readonly orderId: string, // Reference for in-app notification
    public readonly orderNumber: string, // Human-readable "ORD-20260205-XXXX"
    public readonly reason: string, // Customer's reason for refund
  ) {}
}
