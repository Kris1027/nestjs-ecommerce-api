import { Logger } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PaymentListener } from './payment.listener';
import { NotificationsService } from '../notifications.service';
import {
  PaymentSucceededEvent,
  PaymentFailedEvent,
  RefundInitiatedEvent,
  RefundCompletedEvent,
  RefundFailedEvent,
} from '../events';
import { NotificationType } from '../../../generated/prisma/client';
import { createMockNotificationsService } from '@test/mocks/common.mock';

describe('PaymentListener', () => {
  let listener: PaymentListener;
  let notificationsService: ReturnType<typeof createMockNotificationsService>;

  beforeEach(async () => {
    notificationsService = createMockNotificationsService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentListener,
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    listener = module.get<PaymentListener>(PaymentListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePaymentSucceeded', () => {
    it('should notify with PAYMENT_SUCCEEDED type', async () => {
      const event = new PaymentSucceededEvent(
        'user1',
        'test@example.com',
        'John',
        'order1',
        'ORD-001',
        '99.99',
      );

      await listener.handlePaymentSucceeded(event);

      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          type: NotificationType.PAYMENT_SUCCEEDED,
          referenceId: 'order1',
          email: expect.objectContaining({ to: 'test@example.com' }),
        }),
      );
    });

    it('should catch and log errors without throwing', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      notificationsService.notify.mockRejectedValue(new Error('fail'));
      const event = new PaymentSucceededEvent(
        'user1',
        'test@example.com',
        'John',
        'order1',
        'ORD-001',
        '99.99',
      );

      await expect(listener.handlePaymentSucceeded(event)).resolves.toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to handle payment.succeeded'),
      );
    });
  });

  describe('handlePaymentFailed', () => {
    it('should notify with PAYMENT_FAILED type', async () => {
      const event = new PaymentFailedEvent(
        'user1',
        'test@example.com',
        'John',
        'order1',
        'ORD-001',
      );

      await listener.handlePaymentFailed(event);

      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          type: NotificationType.PAYMENT_FAILED,
          referenceId: 'order1',
        }),
      );
    });

    it('should catch and log errors without throwing', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      notificationsService.notify.mockRejectedValue(new Error('fail'));
      const event = new PaymentFailedEvent(
        'user1',
        'test@example.com',
        'John',
        'order1',
        'ORD-001',
      );

      await expect(listener.handlePaymentFailed(event)).resolves.toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to handle payment.failed'),
      );
    });
  });

  describe('handleRefundInitiated', () => {
    it('should notify with REFUND_INITIATED type', async () => {
      const event = new RefundInitiatedEvent(
        'user1',
        'test@example.com',
        'John',
        'order1',
        'ORD-001',
        '50.00',
      );

      await listener.handleRefundInitiated(event);

      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.REFUND_INITIATED,
          referenceId: 'order1',
        }),
      );
    });

    it('should catch and log errors without throwing', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      notificationsService.notify.mockRejectedValue(new Error('fail'));
      const event = new RefundInitiatedEvent(
        'user1',
        'test@example.com',
        'John',
        'order1',
        'ORD-001',
        '50.00',
      );

      await expect(listener.handleRefundInitiated(event)).resolves.toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to handle refund.initiated'),
      );
    });
  });

  describe('handleRefundCompleted', () => {
    it('should notify with REFUND_COMPLETED type', async () => {
      const event = new RefundCompletedEvent(
        'user1',
        'test@example.com',
        'John',
        'order1',
        'ORD-001',
        '50.00',
      );

      await listener.handleRefundCompleted(event);

      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.REFUND_COMPLETED,
        }),
      );
    });

    it('should catch and log errors without throwing', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      notificationsService.notify.mockRejectedValue(new Error('fail'));
      const event = new RefundCompletedEvent(
        'user1',
        'test@example.com',
        'John',
        'order1',
        'ORD-001',
        '50.00',
      );

      await expect(listener.handleRefundCompleted(event)).resolves.toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to handle refund.completed'),
      );
    });
  });

  describe('handleRefundFailed', () => {
    it('should notify with REFUND_FAILED type', async () => {
      const event = new RefundFailedEvent('user1', 'test@example.com', 'John', 'order1', 'ORD-001');

      await listener.handleRefundFailed(event);

      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.REFUND_FAILED,
        }),
      );
    });

    it('should catch and log errors without throwing', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      notificationsService.notify.mockRejectedValue(new Error('fail'));
      const event = new RefundFailedEvent('user1', 'test@example.com', 'John', 'order1', 'ORD-001');

      await expect(listener.handleRefundFailed(event)).resolves.toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to handle refund.failed'),
      );
    });
  });
});
