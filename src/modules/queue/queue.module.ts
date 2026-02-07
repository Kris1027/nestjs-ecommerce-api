import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { type Env } from '../../config/env.validation';
import { QUEUE_NAMES } from './queue.types';
import { QueueService } from './queue.service';
import { EmailProcessor } from './processors/email.processor'; // ADD THIS

@Module({
  imports: [
    // Configure BullMQ connection to Redis
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService<Env, true>) => ({
        connection: {
          url: configService.get('REDIS_URL'),
        },
      }),
      inject: [ConfigService],
    }),

    // Register queues with default job options
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.EMAIL,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: QUEUE_NAMES.CLEANUP,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
    ),
  ],
  providers: [QueueService, EmailProcessor], // ADD EmailProcessor
  exports: [QueueService],
})
export class QueueModule {}
