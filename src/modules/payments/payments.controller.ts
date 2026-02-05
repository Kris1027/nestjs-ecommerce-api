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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import {
  CreatePaymentIntentDto,
  ExpireAbandonedResponseDto,
  PaymentDto,
  PaymentIntentResponseDto,
  PaymentQueryDto,
  PaymentWithOrderDto,
  RefundDto,
  WebhookResponseDto,
} from './dto';
import { PaymentsService } from './payments.service';
import { ApiErrorResponses, ApiPaginatedResponse, ApiSuccessResponse } from '../../common/swagger';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ============================================
  // CUSTOMER ENDPOINTS
  // ============================================

  @Post('create-intent')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create Stripe PaymentIntent for an order' })
  @ApiSuccessResponse(PaymentIntentResponseDto, 201, 'PaymentIntent created')
  @ApiErrorResponses(400, 401, 404, 429)
  createPaymentIntent(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePaymentIntentDto,
  ): ReturnType<PaymentsService['createPaymentIntent']> {
    return this.paymentsService.createPaymentIntent(userId, dto);
  }

  @Get('order/:orderId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get payment status for an order' })
  @ApiParam({ name: 'orderId', description: 'Order CUID' })
  @ApiSuccessResponse(PaymentWithOrderDto, 200, 'Payment retrieved')
  @ApiErrorResponses(401, 404, 429)
  getPaymentByOrderId(
    @CurrentUser('sub') userId: string,
    @Param('orderId') orderId: string,
  ): ReturnType<PaymentsService['getPaymentByOrderId']> {
    return this.paymentsService.getPaymentByOrderId(orderId, userId);
  }

  // ============================================
  // WEBHOOK (no auth, no rate limit)
  // ============================================

  @Post('webhook')
  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook receiver (public, no auth)' })
  @ApiSuccessResponse(WebhookResponseDto, 200, 'Webhook processed')
  @ApiErrorResponses(400)
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): ReturnType<PaymentsService['handleWebhook']> {
    return this.paymentsService.handleWebhook(req.rawBody!, signature);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Get()
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all payments (admin)' })
  @ApiPaginatedResponse(PaymentWithOrderDto, 'Paginated payment list')
  @ApiErrorResponses(401, 403, 429)
  getAllPayments(@Query() query: PaymentQueryDto): ReturnType<PaymentsService['getAllPayments']> {
    return this.paymentsService.getAllPayments(query);
  }

  @Post(':paymentId/refund')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Issue full or partial refund (admin)' })
  @ApiParam({ name: 'paymentId', description: 'Payment CUID' })
  @ApiSuccessResponse(PaymentDto, 200, 'Refund initiated')
  @ApiErrorResponses(400, 401, 403, 404, 429)
  refund(
    @Param('paymentId') paymentId: string,
    @Body() dto: RefundDto,
  ): ReturnType<PaymentsService['refund']> {
    return this.paymentsService.refund(paymentId, dto);
  }

  @Post('expire-abandoned')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Expire PENDING payments older than 24h (admin)' })
  @ApiSuccessResponse(ExpireAbandonedResponseDto, 200, 'Abandoned payments expired')
  @ApiErrorResponses(401, 403, 429)
  expireAbandonedPayments(): ReturnType<PaymentsService['expireAbandonedPayments']> {
    return this.paymentsService.expireAbandonedPayments();
  }
}
