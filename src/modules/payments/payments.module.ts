import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsController } from './payments.controller';
import { StripeProvider } from './payments.provider';
import { PaymentsService } from './payments.service';

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [StripeProvider, PaymentsService],
})
export class PaymentsModule {}
