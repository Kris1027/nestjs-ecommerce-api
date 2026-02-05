import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '../../../generated/prisma/client';
import { NotificationsService } from '../notifications.service';
import {
  NotificationEvents,
  PaymentSucceededEvent,
  PaymentFailedEvent,
  RefundInitiatedEvent,
  RefundCompletedEvent,
  RefundFailedEvent,
} from '../events';
import {
  paymentSucceededEmail,
  paymentFailedEmail,
  refundInitiatedEmail,
  refundCompletedEmail,
  refundFailedEmail,
} from '../email-templates';

@Injectable()
export class PaymentListener {
  private readonly logger = new Logger(PaymentListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(NotificationEvents.PAYMENT_SUCCEEDED, { async: true })
  async handlePaymentSucceeded(event: PaymentSucceededEvent): Promise<void> {
    try {
      const email = paymentSucceededEmail(event.userFirstName, event.orderNumber, event.amount);

      await this.notificationsService.notify({
        userId: event.userId,
        type: NotificationType.PAYMENT_SUCCEEDED,
        title: 'Payment received',
        body: `Payment of ${event.amount} PLN for order ${event.orderNumber} confirmed.`,
        referenceId: event.orderId,
        email: { to: event.userEmail, ...email },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to handle payment.succeeded: ${msg}`);
    }
  }

  @OnEvent(NotificationEvents.PAYMENT_FAILED, { async: true })
  async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
    try {
      const email = paymentFailedEmail(event.userFirstName, event.orderNumber);

      await this.notificationsService.notify({
        userId: event.userId,
        type: NotificationType.PAYMENT_FAILED,
        title: 'Payment failed',
        body: `Payment for order ${event.orderNumber} was not successful.`,
        referenceId: event.orderId,
        email: { to: event.userEmail, ...email },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to handle payment.failed: ${msg}`);
    }
  }

  @OnEvent(NotificationEvents.REFUND_INITIATED, { async: true })
  async handleRefundInitiated(event: RefundInitiatedEvent): Promise<void> {
    try {
      const email = refundInitiatedEmail(event.userFirstName, event.orderNumber, event.amount);

      await this.notificationsService.notify({
        userId: event.userId,
        type: NotificationType.REFUND_INITIATED,
        title: 'Refund initiated',
        body: `A refund of ${event.amount} PLN for order ${event.orderNumber} has been initiated.`,
        referenceId: event.orderId,
        email: { to: event.userEmail, ...email },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to handle refund.initiated: ${msg}`);
    }
  }

  @OnEvent(NotificationEvents.REFUND_COMPLETED, { async: true })
  async handleRefundCompleted(event: RefundCompletedEvent): Promise<void> {
    try {
      const email = refundCompletedEmail(event.userFirstName, event.orderNumber, event.amount);

      await this.notificationsService.notify({
        userId: event.userId,
        type: NotificationType.REFUND_COMPLETED,
        title: 'Refund completed',
        body: `Your refund of ${event.amount} PLN for order ${event.orderNumber} is complete.`,
        referenceId: event.orderId,
        email: { to: event.userEmail, ...email },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to handle refund.completed: ${msg}`);
    }
  }

  @OnEvent(NotificationEvents.REFUND_FAILED, { async: true })
  async handleRefundFailed(event: RefundFailedEvent): Promise<void> {
    try {
      const email = refundFailedEmail(event.userFirstName, event.orderNumber);

      await this.notificationsService.notify({
        userId: event.userId,
        type: NotificationType.REFUND_FAILED,
        title: 'Refund issue',
        body: `There was an issue with the refund for order ${event.orderNumber}.`,
        referenceId: event.orderId,
        email: { to: event.userEmail, ...email },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to handle refund.failed: ${msg}`);
    }
  }
}
