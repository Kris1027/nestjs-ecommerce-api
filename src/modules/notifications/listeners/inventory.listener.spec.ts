import { Logger } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { InventoryListener } from './inventory.listener';
import { NotificationsService } from '../notifications.service';
import { EmailService } from '../email.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { LowStockEvent } from '../events';
import { NotificationType } from '../../../generated/prisma/client';
import { createMockPrismaClient, resetMockPrismaClient } from '@test/mocks/prisma.mock';
import { createMockEmailService, createMockNotificationsService } from '@test/mocks/common.mock';

describe('InventoryListener', () => {
  let listener: InventoryListener;
  let notificationsService: ReturnType<typeof createMockNotificationsService>;
  let emailService: ReturnType<typeof createMockEmailService>;
  let prisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(async () => {
    notificationsService = createMockNotificationsService();
    emailService = createMockEmailService();
    prisma = createMockPrismaClient();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryListener,
        { provide: NotificationsService, useValue: notificationsService },
        { provide: EmailService, useValue: emailService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    listener = module.get<InventoryListener>(InventoryListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
    resetMockPrismaClient(prisma);
  });

  describe('handleLowStock', () => {
    const event = new LowStockEvent('prod1', 'Wireless Headphones', 3, 10);

    it('should notify all admins and send batch email', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'admin1', email: 'admin1@example.com' },
        { id: 'admin2', email: 'admin2@example.com' },
      ]);

      await listener.handleLowStock(event);

      // In-app notification per admin
      expect(notificationsService.notify).toHaveBeenCalledTimes(2);
      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin1',
          type: NotificationType.LOW_STOCK,
          referenceId: 'prod1',
        }),
      );
      // Batch email
      expect(emailService.sendToMany).toHaveBeenCalledWith(
        ['admin1@example.com', 'admin2@example.com'],
        expect.any(String),
        expect.any(String),
      );
    });

    it('should skip when no active admins found', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await listener.handleLowStock(event);

      expect(notificationsService.notify).not.toHaveBeenCalled();
      expect(emailService.sendToMany).not.toHaveBeenCalled();
    });

    it('should catch and log errors without throwing', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      prisma.user.findMany.mockRejectedValue(new Error('DB down'));

      await expect(listener.handleLowStock(event)).resolves.toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to handle low_stock'));
    });
  });
});
