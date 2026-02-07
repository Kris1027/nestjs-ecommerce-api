import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { type Env } from '../../config/env.validation';
import { QUEUE_NAMES } from './queue.types';
import { QueueService } from './queue.service';

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

    // Register our two queues with default job options
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.EMAIL,
        defaultJobOptions: {
          attempts: 3, // Retry failed jobs 3 times
          backoff: { type: 'exponential', delay: 2000 }, // 2s, 4s, 8s delays
          removeOnComplete: true, // Don't keep successful jobs in Redis
          removeOnFail: false, // Keep failed jobs for debugging
        },
      },
      {
        name: QUEUE_NAMES.CLEANUP,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 }, // 5s base for cleanup
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
    ),
  ],
  providers: [QueueService],
  exports: [QueueService], // Other modules can inject QueueService
})
export class QueueModule {}
