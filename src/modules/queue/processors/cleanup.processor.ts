import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentsService } from '../../payments/payments.service';
import { QUEUE_NAMES, CLEANUP_JOBS } from '../queue.types';

@Processor(QUEUE_NAMES.CLEANUP) // This processor handles jobs from the 'cleanup' queue
export class CleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {
    super();
  }

  /**
   * Route incoming cleanup jobs to appropriate handler.
   */
  async process(job: Job): Promise<void> {
    this.logger.log(`Running cleanup job: ${job.name}`);

    switch (job.name) {
      case CLEANUP_JOBS.EXPIRED_REFRESH_TOKENS:
        await this.cleanupExpiredRefreshTokens();
        break;

      case CLEANUP_JOBS.EXPIRED_VERIFICATION_TOKENS:
        await this.cleanupExpiredVerificationTokens();
        break;

      case CLEANUP_JOBS.EXPIRED_RESET_TOKENS:
        await this.cleanupExpiredResetTokens();
        break;

      case CLEANUP_JOBS.EXPIRED_GUEST_CARTS:
        await this.cleanupExpiredGuestCarts();
        break;

      case CLEANUP_JOBS.ABANDONED_PAYMENTS:
        await this.cleanupAbandonedPayments();
        break;

      case CLEANUP_JOBS.OLD_WEBHOOK_EVENTS:
        await this.cleanupOldWebhookEvents();
        break;

      case CLEANUP_JOBS.OLD_NOTIFICATIONS:
        await this.cleanupOldNotifications();
        break;

      default:
        this.logger.warn(`Unknown cleanup job: ${job.name}`);
    }
  }

  /**
   * Delete expired or revoked refresh tokens.
   */
  private async cleanupExpiredRefreshTokens(): Promise<void> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } }, // Expired
          { isRevoked: true }, // Revoked
        ],
      },
    });

    this.logger.log(`Deleted ${result.count} expired/revoked refresh tokens`);
  }

  /**
   * Clear expired email verification tokens from users.
   */
  private async cleanupExpiredVerificationTokens(): Promise<void> {
    const result = await this.prisma.user.updateMany({
      where: {
        emailVerificationExpiry: { lt: new Date() },
        emailVerificationToken: { not: null }, // Only if token exists
      },
      data: {
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    this.logger.log(`Cleared ${result.count} expired verification tokens`);
  }

  /**
   * Clear expired password reset tokens from users.
   */
  private async cleanupExpiredResetTokens(): Promise<void> {
    const result = await this.prisma.user.updateMany({
      where: {
        passwordResetExpiry: { lt: new Date() },
        passwordResetToken: { not: null }, // Only if token exists
      },
      data: {
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    this.logger.log(`Cleared ${result.count} expired password reset tokens`);
  }

  /**
   * Delete expired guest carts (30+ days old).
   */
  private async cleanupExpiredGuestCarts(): Promise<void> {
    const result = await this.prisma.guestCart.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    this.logger.log(`Deleted ${result.count} expired guest carts`);
  }

  /**
   * Expire abandoned payments (24h+ pending).
   * Delegates to PaymentsService which also cancels Stripe intents.
   */
  private async cleanupAbandonedPayments(): Promise<void> {
    const result = await this.paymentsService.expireAbandonedPayments();
    this.logger.log(`Expired ${result.expired} abandoned payments`);
  }

  /**
   * Delete old webhook events (30+ days).
   */
  private async cleanupOldWebhookEvents(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.webhookEvent.deleteMany({
      where: {
        processedAt: { lt: thirtyDaysAgo },
      },
    });

    this.logger.log(`Deleted ${result.count} old webhook events`);
  }

  /**
   * Delete old read notifications (90+ days).
   */
  private async cleanupOldNotifications(): Promise<void> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.notification.deleteMany({
      where: {
        isRead: true, // Only delete read notifications
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    this.logger.log(`Deleted ${result.count} old read notifications`);
  }

  /**
   * Log when a cleanup job fails after all retries.
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Cleanup job ${job.name} failed after ${job.attemptsMade} attempts: ${error.message}`,
      error.stack,
    );
  }
}
