import { Test, type TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { QueueService } from '../queue/queue.service';

describe('EmailService', () => {
  let service: EmailService;
  let queueService: { queueEmail: jest.Mock };

  beforeEach(async () => {
    queueService = {
      queueEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService, { provide: QueueService, useValue: queueService }],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('send', () => {
    it('should queue email and return true', async () => {
      const result = await service.send('user@example.com', 'Test Subject', '<p>Body</p>');

      expect(result).toBe(true);
      expect(queueService.queueEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Body</p>',
      });
    });

    it('should return false when queuing fails', async () => {
      queueService.queueEmail.mockRejectedValue(new Error('Redis down'));

      const result = await service.send('user@example.com', 'Test', '<p>Test</p>');

      expect(result).toBe(false);
    });

    it('should never throw even on error', async () => {
      queueService.queueEmail.mockRejectedValue(new Error('Connection refused'));

      await expect(service.send('user@example.com', 'Test', '<p>Test</p>')).resolves.toBe(false);
    });
  });

  describe('sendToMany', () => {
    it('should send to multiple recipients', async () => {
      await service.sendToMany(
        ['a@example.com', 'b@example.com', 'c@example.com'],
        'Alert',
        '<p>Alert</p>',
      );

      expect(queueService.queueEmail).toHaveBeenCalledTimes(3);
      expect(queueService.queueEmail).toHaveBeenCalledWith({
        to: 'a@example.com',
        subject: 'Alert',
        html: '<p>Alert</p>',
      });
    });

    it('should do nothing for empty recipients list', async () => {
      await service.sendToMany([], 'Alert', '<p>Alert</p>');

      expect(queueService.queueEmail).not.toHaveBeenCalled();
    });

    it('should continue sending when some recipients fail', async () => {
      queueService.queueEmail
        .mockResolvedValueOnce(undefined) // first succeeds
        .mockRejectedValueOnce(new Error('Failed')) // second fails
        .mockResolvedValueOnce(undefined); // third succeeds

      await service.sendToMany(
        ['a@example.com', 'b@example.com', 'c@example.com'],
        'Alert',
        '<p>Alert</p>',
      );

      expect(queueService.queueEmail).toHaveBeenCalledTimes(3);
    });
  });
});
