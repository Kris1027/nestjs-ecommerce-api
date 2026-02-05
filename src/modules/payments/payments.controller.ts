import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { CreatePaymentIntentDto, PaymentQueryDto, RefundDto } from './dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ============================================
  // CUSTOMER ENDPOINTS
  // ============================================

  // POST /payments/create-intent - Create Stripe payment intent for an order
  @Post('create-intent')
  @HttpCode(HttpStatus.CREATED)
  createPaymentIntent(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePaymentIntentDto,
  ): ReturnType<PaymentsService['createPaymentIntent']> {
    return this.paymentsService.createPaymentIntent(userId, dto);
  }

  // GET /payments/order/:orderId - Get payment status for an order (customer)
  @Get('order/:orderId')
  getPaymentByOrderId(
    @CurrentUser('sub') userId: string,
    @Param('orderId') orderId: string,
  ): ReturnType<PaymentsService['getPaymentByOrderId']> {
    return this.paymentsService.getPaymentByOrderId(orderId, userId);
  }

  // ============================================
  // WEBHOOK (no auth, no rate limit)
  // ============================================

  // POST /payments/webhook - Stripe webhook receiver
  @Post('webhook')
  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): ReturnType<PaymentsService['handleWebhook']> {
    return this.paymentsService.handleWebhook(req.rawBody!, signature);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  // GET /payments - List all payments (admin)
  @Get()
  @Roles('ADMIN')
  getAllPayments(@Query() query: PaymentQueryDto): ReturnType<PaymentsService['getAllPayments']> {
    return this.paymentsService.getAllPayments(query);
  }

  // POST /payments/:paymentId/refund - Issue refund (admin)
  @Post(':paymentId/refund')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  refund(
    @Param('paymentId') paymentId: string,
    @Body() dto: RefundDto,
  ): ReturnType<PaymentsService['refund']> {
    return this.paymentsService.refund(paymentId, dto);
  }

  // POST /payments/expire-abandoned - Expire stale PENDING payments (admin)
  @Post('expire-abandoned')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  expireAbandonedPayments(): ReturnType<PaymentsService['expireAbandonedPayments']> {
    return this.paymentsService.expireAbandonedPayments();
  }
}
