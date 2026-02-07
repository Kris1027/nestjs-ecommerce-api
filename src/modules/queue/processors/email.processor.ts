import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Resend } from 'resend';

import { type Env } from '../../../config/env.validation';
import { QUEUE_NAMES, EMAIL_JOBS, type EmailJobData } from '../queue.types';

@Processor(QUEUE_NAMES.EMAIL) // This processor handles jobs from the 'email' queue
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly resend: Resend;
  private readonly emailFrom: string;

  constructor(private readonly configService: ConfigService<Env, true>) {
    super();
    // Initialize Resend SDK with API key
    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
    this.emailFrom = this.configService.get('EMAIL_FROM');
  }

  /**
   * Process incoming email jobs.
   * Called automatically by BullMQ when a job is ready.
   */
  async process(job: Job<EmailJobData, void, string>): Promise<void> {
    // Route to correct handler based on job name
    if (job.name === EMAIL_JOBS.SEND) {
      await this.sendEmail(job.data);
    } else {
      this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  /**
   * Send email via Resend API.
   * Throws on failure to trigger BullMQ retry.
   */
  private async sendEmail(data: EmailJobData): Promise<void> {
    const { to, subject, html } = data;

    const result = await this.resend.emails.send({
      from: this.emailFrom,
      to,
      subject,
      html,
    });

    // Resend returns { data, error } - check for errors
    if (result.error) {
      // Throwing triggers BullMQ retry with exponential backoff
      throw new Error(`Resend error: ${result.error.message}`);
    }

    this.logger.log(`Email sent to ${to}: ${subject}`);
  }

  /**
   * Called when a job fails after all retry attempts.
   * Logs for alerting/monitoring.
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job<EmailJobData>, error: Error): void {
    this.logger.error(
      `Email job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
      { to: job.data.to, subject: job.data.subject },
    );
  }
}
