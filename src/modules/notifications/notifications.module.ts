import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { ResendProvider } from './notifications.provider';
// Listeners — registered as providers so NestJS can inject dependencies
import { OrderListener } from './listeners/order.listener';
import { PaymentListener } from './listeners/payment.listener';
import { InventoryListener } from './listeners/inventory.listener';
import { AuthListener } from './listeners/auth.listener';

@Module({
  controllers: [NotificationsController],
  providers: [
    // SDK provider (like StripeProvider in payments module)
    ResendProvider,

    // Services
    NotificationsService,
    EmailService,

    // Event listeners — must be registered as providers for @OnEvent to work
    OrderListener,
    PaymentListener,
    InventoryListener,
    AuthListener,
  ],
  // Export services so other modules can inject EventEmitter2 and emit events
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
