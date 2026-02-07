import { type User } from '../../src/generated/prisma/client';
import { Role } from '../../src/generated/prisma/enums';

/**
 * Factory function to create a mock User object
 * Override any fields by passing partial user data
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  const now = new Date();

  return {
    id: 'cluser123456789012345678',
    email: 'test@example.com',
    password: '$2b$12$hashedpasswordhere1234567890abcdefghijklmnop', // bcrypt hash
    firstName: 'John',
    lastName: 'Doe',
    role: Role.CUSTOMER,
    isActive: true,
    emailVerifiedAt: now,
    emailVerificationToken: null,
    emailVerificationExpiry: null,
    passwordResetToken: null,
    passwordResetExpiry: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create an admin user
 */
export function createMockAdmin(overrides: Partial<User> = {}): User {
  return createMockUser({
    id: 'cladmin12345678901234567',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: Role.ADMIN,
    ...overrides,
  });
}

/**
 * Create an unverified user (email not verified)
 */
export function createMockUnverifiedUser(overrides: Partial<User> = {}): User {
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  return createMockUser({
    id: 'clunverified12345678901',
    email: 'unverified@example.com',
    emailVerifiedAt: null,
    emailVerificationToken: 'hashed-verification-token',
    emailVerificationExpiry: expiry,
    ...overrides,
  });
}

/**
 * Create a deactivated user
 */
export function createMockDeactivatedUser(overrides: Partial<User> = {}): User {
  return createMockUser({
    id: 'cldeactivated123456789',
    email: 'deactivated@example.com',
    isActive: false,
    ...overrides,
  });
}

/**
 * Sample DTOs for testing
 */
export const sampleRegisterDto = {
  email: 'newuser@example.com',
  password: 'SecurePass123',
  firstName: 'New',
  lastName: 'User',
};

export const sampleLoginDto = {
  email: 'test@example.com',
  password: 'SecurePass123',
};
