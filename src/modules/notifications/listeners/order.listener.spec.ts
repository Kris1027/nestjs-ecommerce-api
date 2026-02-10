import { Test, type TestingModule } from '@nestjs/testing';
import { OrderListener } from './order.listener';
import { NotificationsService } from '../notifications.service';
import { EmailService } from '../email.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { OrderCreatedEvent, OrderStatusChangedEvent, RefundRequestCreatedEvent } from '../events';
import { NotificationType } from '../../../generated/prisma/client';
import { createMockPrismaClient, resetMockPrismaClient } from '@test/mocks/prisma.mock';
import { createMockEmailService } from '@test/mocks/common.mock';

function createMockNotificationsService(): { notify: jest.Mock } {
  return { notify: jest.fn().mockResolvedValue(undefined) };
}

describe('OrderListener', () => {
  let listener: OrderListener;
  let notificationsService: ReturnType<typeof createMockNotificationsService>;
  let emailService: ReturnType<typeof createMockEmailService>;
  let prisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(async () => {
    notificationsService = createMockNotificationsService();
    emailService = createMockEmailService();
    prisma = createMockPrismaClient();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderListener,
        { provide: NotificationsService, useValue: notificationsService },
        { provide: EmailService, useValue: emailService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    listener = module.get<OrderListener>(OrderListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
    resetMockPrismaClient(prisma);
  });

  describe('handleOrderCreated', () => {
    it('should notify with ORDER_CREATED type', async () => {
      const event = new OrderCreatedEvent(
        'user1',
        'test@example.com',
        'John',
        'order1',
        'ORD-001',
        '199.99',
      );

      await listener.handleOrderCreated(event);

      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          type: NotificationType.ORDER_CREATED,
          referenceId: 'order1',
          email: expect.objectContaining({ to: 'test@example.com' }),
        }),
      );
    });

    it('should catch errors without throwing', async () => {
      notificationsService.notify.mockRejectedValue(new Error('fail'));
      const event = new OrderCreatedEvent(
        'user1',
        'test@example.com',
        'John',
        'order1',
        'ORD-001',
        '199.99',
      );

      await expect(listener.handleOrderCreated(event)).resolves.toBeUndefined();
    });
  });

  describe('handleOrderStatusChanged', () => {
    const baseEvent = (status: string): OrderStatusChangedEvent =>
      new OrderStatusChangedEvent('user1', 'test@example.com', 'John', 'order1', 'ORD-001', status);

    it('should notify for SHIPPED status', async () => {
      await listener.handleOrderStatusChanged(baseEvent('SHIPPED'));

      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.ORDER_SHIPPED }),
      );
    });

    it('should notify for DELIVERED status', async () => {
      await listener.handleOrderStatusChanged(baseEvent('DELIVERED'));

      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.ORDER_DELIVERED }),
      );
    });

    it('should notify for CANCELLED status', async () => {
      await listener.handleOrderStatusChanged(baseEvent('CANCELLED'));

      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.ORDER_CANCELLED }),
      );
    });

    it('should skip notification for CONFIRMED status', async () => {
      await listener.handleOrderStatusChanged(baseEvent('CONFIRMED'));

      expect(notificationsService.notify).not.toHaveBeenCalled();
    });

    it('should skip notification for PROCESSING status', async () => {
      await listener.handleOrderStatusChanged(baseEvent('PROCESSING'));

      expect(notificationsService.notify).not.toHaveBeenCalled();
    });

    it('should catch errors without throwing', async () => {
      notificationsService.notify.mockRejectedValue(new Error('fail'));

      await expect(
        listener.handleOrderStatusChanged(baseEvent('SHIPPED')),
      ).resolves.toBeUndefined();
    });
  });

  describe('handleRefundRequestCreated', () => {
    const event = new RefundRequestCreatedEvent(
      'user1',
      'test@example.com',
      'John',
      'order1',
      'ORD-001',
      'Defective product',
    );

    it('should notify customer and all admins', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'admin1', email: 'admin1@example.com' },
        { id: 'admin2', email: 'admin2@example.com' },
      ]);

      await listener.handleRefundRequestCreated(event);

      // Customer notification
      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          type: NotificationType.REFUND_REQUEST_CREATED,
        }),
      );
      // Admin notifications (one per admin)
      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'admin1' }),
      );
      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'admin2' }),
      );
      // Batch email to admins
      expect(emailService.sendToMany).toHaveBeenCalledWith(
        ['admin1@example.com', 'admin2@example.com'],
        expect.any(String),
        expect.any(String),
      );
    });

    it('should skip admin notification when no active admins', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await listener.handleRefundRequestCreated(event);

      // Customer notification still sent
      expect(notificationsService.notify).toHaveBeenCalledTimes(1);
      // No admin email
      expect(emailService.sendToMany).not.toHaveBeenCalled();
    });

    it('should catch errors without throwing', async () => {
      notificationsService.notify.mockRejectedValue(new Error('fail'));

      await expect(listener.handleRefundRequestCreated(event)).resolves.toBeUndefined();
    });
  });
});
