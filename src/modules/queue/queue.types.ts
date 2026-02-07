// Queue name constants - used when registering queues and processors
export const QUEUE_NAMES = {
  EMAIL: 'email', // Handles all outgoing emails
  CLEANUP: 'cleanup', // Handles scheduled cleanup tasks
} as const;

// Job names for the EMAIL queue
export const EMAIL_JOBS = {
  SEND: 'send', // Send a single email
} as const;

// Job names for the CLEANUP queue - each maps to a scheduled task
export const CLEANUP_JOBS = {
  EXPIRED_REFRESH_TOKENS: 'expired-refresh-tokens',
  EXPIRED_VERIFICATION_TOKENS: 'expired-verification-tokens',
  EXPIRED_RESET_TOKENS: 'expired-reset-tokens',
  EXPIRED_GUEST_CARTS: 'expired-guest-carts',
  ABANDONED_PAYMENTS: 'abandoned-payments',
  OLD_WEBHOOK_EVENTS: 'old-webhook-events',
  OLD_NOTIFICATIONS: 'old-notifications',
} as const;

// Payload for email jobs - what data the processor needs to send an email
export interface EmailJobData {
  to: string; // Recipient email address
  subject: string; // Email subject line
  html: string; // HTML body content
}
