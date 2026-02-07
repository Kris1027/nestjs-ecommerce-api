import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { QUEUE_NAMES, CLEANUP_JOBS, EMAIL_JOBS, type EmailJobData } from './queue.types';

@Injectable()
export class QueueService implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    // Inject both queues using their registered names
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.CLEANUP) private readonly cleanupQueue: Queue,
  ) {}

  /**
   * Called automatically when module initializes.
   * Sets up all recurring cleanup job schedules.
   */
  async onModuleInit(): Promise<void> {
    await this.setupCleanupSchedules();
    this.logger.log('Cleanup job schedules initialized');
  }

  /**
   * Queue an email for sending.
   * Returns immediately - email is processed in background.
   */
  async queueEmail(data: EmailJobData): Promise<void> {
    await this.emailQueue.add(EMAIL_JOBS.SEND, data);
    this.logger.debug(`Queued email to ${data.to}: ${data.subject}`);
  }

  /**
   * Set up recurring schedules for all cleanup jobs.
   * Uses upsertJobScheduler to create or update schedules idempotently.
   */
  private async setupCleanupSchedules(): Promise<void> {
    // Daily at 3:00 AM - clean expired refresh tokens
    await this.cleanupQueue.upsertJobScheduler(
      CLEANUP_JOBS.EXPIRED_REFRESH_TOKENS,
      { pattern: '0 3 * * *' }, // Cron: minute hour day month weekday
      { name: CLEANUP_JOBS.EXPIRED_REFRESH_TOKENS, data: {} },
    );

    // Daily at 3:05 AM - clean expired verification tokens
    await this.cleanupQueue.upsertJobScheduler(
      CLEANUP_JOBS.EXPIRED_VERIFICATION_TOKENS,
      { pattern: '5 3 * * *' },
      { name: CLEANUP_JOBS.EXPIRED_VERIFICATION_TOKENS, data: {} },
    );

    // Daily at 3:10 AM - clean expired password reset tokens
    await this.cleanupQueue.upsertJobScheduler(
      CLEANUP_JOBS.EXPIRED_RESET_TOKENS,
      { pattern: '10 3 * * *' },
      { name: CLEANUP_JOBS.EXPIRED_RESET_TOKENS, data: {} },
    );

    // Daily at 3:15 AM - clean expired guest carts
    await this.cleanupQueue.upsertJobScheduler(
      CLEANUP_JOBS.EXPIRED_GUEST_CARTS,
      { pattern: '15 3 * * *' },
      { name: CLEANUP_JOBS.EXPIRED_GUEST_CARTS, data: {} },
    );

    // Hourly - expire abandoned payments (24h+ pending)
    await this.cleanupQueue.upsertJobScheduler(
      CLEANUP_JOBS.ABANDONED_PAYMENTS,
      { pattern: '0 * * * *' }, // Every hour at minute 0
      { name: CLEANUP_JOBS.ABANDONED_PAYMENTS, data: {} },
    );

    // Weekly Sunday 4:00 AM - clean old webhook events (30+ days)
    await this.cleanupQueue.upsertJobScheduler(
      CLEANUP_JOBS.OLD_WEBHOOK_EVENTS,
      { pattern: '0 4 * * 0' }, // 0 = Sunday
      { name: CLEANUP_JOBS.OLD_WEBHOOK_EVENTS, data: {} },
    );

    // Weekly Sunday 4:30 AM - clean old read notifications (90+ days)
    await this.cleanupQueue.upsertJobScheduler(
      CLEANUP_JOBS.OLD_NOTIFICATIONS,
      { pattern: '30 4 * * 0' },
      { name: CLEANUP_JOBS.OLD_NOTIFICATIONS, data: {} },
    );
  }
}
