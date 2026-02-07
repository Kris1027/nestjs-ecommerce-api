import { Injectable, Logger } from '@nestjs/common';

import { QueueService } from '../queue/queue.service';

// Handles all email sending via BullMQ queue
// CRITICAL: This service NEVER throws — queuing failures must not break business logic
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly queueService: QueueService) {}

  // Queue an email for sending — returns immediately
  // Returns true if queued successfully, false if queuing failed
  async send(
    to: string, // Recipient email address
    subject: string, // Email subject line
    html: string, // HTML body from email-templates.ts
  ): Promise<boolean> {
    try {
      // Add to queue — actual sending happens in EmailProcessor
      await this.queueService.queueEmail({ to, subject, html });
      this.logger.debug(`Email queued to ${to}: "${subject}"`);
      return true;
    } catch (error: unknown) {
      // NEVER throw — log and return false so business logic continues
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to queue email to ${to}: "${subject}" — ${message}`);
      return false;
    }
  }

  // Queue the same email to multiple recipients (e.g., low stock alert to all admins)
  // Uses Promise.allSettled so one failure doesn't block others
  async sendToMany(
    recipients: string[], // List of email addresses
    subject: string,
    html: string,
  ): Promise<void> {
    if (recipients.length === 0) {
      return;
    }

    // Queue all emails in parallel — allSettled ensures all complete regardless of failures
    const results = await Promise.allSettled(recipients.map((to) => this.send(to, subject, html)));

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      this.logger.warn(
        `Batch email: ${failed.length}/${recipients.length} failed to queue for "${subject}"`,
      );
    }
  }
}
