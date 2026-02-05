import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '../../../generated/prisma/client';
import { NotificationsService } from '../notifications.service';
import { NotificationEvents, OrderCreatedEvent, OrderStatusChangedEvent } from '../events';
import {
  orderCreatedEmail,
  orderShippedEmail,
  orderDeliveredEmail,
  orderCancelledEmail,
} from '../email-templates';

@Injectable()
export class OrderListener {
  private readonly logger = new Logger(OrderListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  // Fired after checkout completes successfully
  @OnEvent(NotificationEvents.ORDER_CREATED, { async: true })
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      const email = orderCreatedEmail(event.userFirstName, event.orderNumber, event.total);

      await this.notificationsService.notify({
        userId: event.userId,
        type: NotificationType.ORDER_CREATED,
        title: 'Order placed',
        body: `Your order ${event.orderNumber} has been placed.`,
        referenceId: event.orderId,
        email: { to: event.userEmail, ...email },
      });
    } catch (error: unknown) {
      // Listeners must never crash — log and continue
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to handle order.created: ${msg}`);
    }
  }

  // Fired when admin updates order status
  // Only SHIPPED, DELIVERED, CANCELLED trigger customer notifications
  @OnEvent(NotificationEvents.ORDER_STATUS_CHANGED, { async: true })
  async handleOrderStatusChanged(event: OrderStatusChangedEvent): Promise<void> {
    try {
      // Map status to notification type and email template
      const statusMap: Record<
        string,
        {
          type: NotificationType;
          title: string;
          body: string;
          email: { subject: string; html: string };
        } | null
      > = {
        SHIPPED: {
          type: NotificationType.ORDER_SHIPPED,
          title: 'Order shipped',
          body: `Your order ${event.orderNumber} is on its way!`,
          email: orderShippedEmail(event.userFirstName, event.orderNumber),
        },
        DELIVERED: {
          type: NotificationType.ORDER_DELIVERED,
          title: 'Order delivered',
          body: `Your order ${event.orderNumber} has been delivered.`,
          email: orderDeliveredEmail(event.userFirstName, event.orderNumber),
        },
        CANCELLED: {
          type: NotificationType.ORDER_CANCELLED,
          title: 'Order cancelled',
          body: `Your order ${event.orderNumber} has been cancelled.`,
          email: orderCancelledEmail(event.userFirstName, event.orderNumber),
        },
      };

      // CONFIRMED, PROCESSING — no notification (internal workflow steps)
      const config = statusMap[event.newStatus];
      if (!config) {
        return;
      }

      await this.notificationsService.notify({
        userId: event.userId,
        type: config.type,
        title: config.title,
        body: config.body,
        referenceId: event.orderId,
        email: { to: event.userEmail, ...config.email },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to handle order.status.changed: ${msg}`);
    }
  }
}
