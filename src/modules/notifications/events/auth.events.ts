// Event emitted after successful user registration
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string, // Newly created user ID
    public readonly userEmail: string, // For welcome email
    public readonly userFirstName: string | null, // For email greeting
  ) {}
}

// Event emitted after successful password change
export class PasswordChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly userEmail: string,
    public readonly userFirstName: string | null,
  ) {}
}
