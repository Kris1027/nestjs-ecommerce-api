import { Test, type TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { QUEUE_NAMES, EMAIL_JOBS } from './queue.types';

describe('QueueService', () => {
  let service: QueueService;
  let emailQueue: { add: jest.Mock; upsertJobScheduler: jest.Mock };
  let cleanupQueue: { add: jest.Mock; upsertJobScheduler: jest.Mock };

  beforeEach(async () => {
    emailQueue = {
      add: jest.fn().mockResolvedValue({}),
      upsertJobScheduler: jest.fn().mockResolvedValue({}),
    };
    cleanupQueue = {
      add: jest.fn().mockResolvedValue({}),
      upsertJobScheduler: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: getQueueToken(QUEUE_NAMES.EMAIL), useValue: emailQueue },
        { provide: getQueueToken(QUEUE_NAMES.CLEANUP), useValue: cleanupQueue },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should set up all 7 cleanup job schedules', async () => {
      await service.onModuleInit();

      expect(cleanupQueue.upsertJobScheduler).toHaveBeenCalledTimes(7);
    });

    it('should register expired-refresh-tokens schedule', async () => {
      await service.onModuleInit();

      expect(cleanupQueue.upsertJobScheduler).toHaveBeenCalledWith(
        'expired-refresh-tokens',
        { pattern: '0 3 * * *' },
        { name: 'expired-refresh-tokens', data: {} },
      );
    });

    it('should register abandoned-payments hourly schedule', async () => {
      await service.onModuleInit();

      expect(cleanupQueue.upsertJobScheduler).toHaveBeenCalledWith(
        'abandoned-payments',
        { pattern: '0 * * * *' },
        { name: 'abandoned-payments', data: {} },
      );
    });

    it('should register weekly old-webhook-events schedule', async () => {
      await service.onModuleInit();

      expect(cleanupQueue.upsertJobScheduler).toHaveBeenCalledWith(
        'old-webhook-events',
        { pattern: '0 4 * * 0' },
        { name: 'old-webhook-events', data: {} },
      );
    });
  });

  describe('queueEmail', () => {
    it('should add email job to email queue', async () => {
      const emailData = {
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      };

      await service.queueEmail(emailData);

      expect(emailQueue.add).toHaveBeenCalledWith(EMAIL_JOBS.SEND, emailData);
    });
  });
});
