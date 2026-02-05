// Event emitted when Stripe confirms payment succeeded
export class PaymentSucceededEvent {
  constructor(
    public readonly userId: string,
    public readonly userEmail: string,
    public readonly userFirstName: string | null,
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly amount: string, // Pre-formatted payment amount
  ) {}
}

// Event emitted when Stripe reports payment failure
export class PaymentFailedEvent {
  constructor(
    public readonly userId: string,
    public readonly userEmail: string,
    public readonly userFirstName: string | null,
    public readonly orderId: string,
    public readonly orderNumber: string,
  ) {}
}

// Event emitted when admin initiates a refund
export class RefundInitiatedEvent {
  constructor(
    public readonly userId: string,
    public readonly userEmail: string,
    public readonly userFirstName: string | null,
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly amount: string, // Refund amount
  ) {}
}

// Event emitted when Stripe confirms refund completed
export class RefundCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly userEmail: string,
    public readonly userFirstName: string | null,
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly amount: string,
  ) {}
}

// Event emitted when Stripe reports refund failure
export class RefundFailedEvent {
  constructor(
    public readonly userId: string,
    public readonly userEmail: string,
    public readonly userFirstName: string | null,
    public readonly orderId: string,
    public readonly orderNumber: string,
  ) {}
}
