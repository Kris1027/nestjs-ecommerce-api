import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Resend } from 'resend';
import type { Env } from '../../config/env.validation';
import { RESEND } from './notifications.provider';

// Handles all email sending via Resend API
// CRITICAL: This service NEVER throws — email failures must not break business logic
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly emailFrom: string; // Cached sender address from env

  constructor(
    @Inject(RESEND) private readonly resend: Resend, // Configured Resend instance from provider
    configService: ConfigService<Env, true>,
  ) {
    // Cache EMAIL_FROM at construction time — avoids repeated ConfigService lookups
    this.emailFrom = configService.get('EMAIL_FROM');
  }

  // Send an email via Resend — never throws, logs errors instead
  // Returns true if sent successfully, false if all retries failed
  async send(
    to: string, // Recipient email address
    subject: string, // Email subject line
    html: string, // HTML body from email-templates.ts
  ): Promise<boolean> {
    try {
      await this.withRetry(async () => {
        const { error } = await this.resend.emails.send({
          from: this.emailFrom, // Validated at startup via Zod
          to,
          subject,
          html,
        });

        // Resend returns errors in response body (not as thrown exceptions)
        // We must check and throw to trigger retry logic
        if (error) {
          const err = new Error(`Resend API error: ${error.name} - ${error.message}`);
          // Attach the error name so retry logic can check retryable types
          (err as Error & { resendErrorName: string }).resendErrorName = error.name;
          throw err;
        }
      });

      this.logger.log(`Email sent to ${to}: "${subject}"`);
      return true;
    } catch (error: unknown) {
      // NEVER throw — log and return false so business logic continues
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${to}: "${subject}" — ${message}`);
      return false;
    }
  }

  // Send the same email to multiple recipients (e.g., low stock alert to all admins)
  // Uses Promise.allSettled so one failure doesn't block others
  async sendToMany(
    recipients: string[], // List of email addresses
    subject: string,
    html: string,
  ): Promise<void> {
    if (recipients.length === 0) {
      return;
    }

    // Fire all emails in parallel — allSettled ensures all complete regardless of failures
    const results = await Promise.allSettled(recipients.map((to) => this.send(to, subject, html)));

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      this.logger.warn(
        `Batch email: ${failed.length}/${recipients.length} failed for "${subject}"`,
      );
    }
  }

  // Retry wrapper — exponential backoff: 2s, 4s, 8s + jitter
  // Only retries on 429 (rate limit) and 5xx (server errors)
  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: unknown) {
        // Only retry on rate limits (429) and server errors (500)
        // Resend error names: "rate_limit_exceeded", "internal_server_error"
        const resendErrorName =
          error instanceof Error
            ? (error as Error & { resendErrorName?: string }).resendErrorName
            : undefined;
        const isRetryable =
          resendErrorName === 'rate_limit_exceeded' || resendErrorName === 'internal_server_error';

        if (attempt === maxRetries || !isRetryable) {
          throw error; // Final attempt or non-retryable — propagate to send() catch
        }

        // Exponential backoff: 2s, 4s, 8s + random jitter (0-500ms)
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        this.logger.warn(
          `Email attempt ${attempt}/${maxRetries} failed, retrying in ${Math.round(delay)}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // TypeScript requires this — the loop always returns or throws
    throw new Error('Retry loop exhausted');
  }
}
