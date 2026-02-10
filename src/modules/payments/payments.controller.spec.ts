import { Test, type TestingModule } from '@nestjs/testing';
import { type RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

function createMockPaymentsService(): Record<keyof PaymentsService, jest.Mock> {
  return {
    createPaymentIntent: jest.fn(),
    getPaymentByOrderId: jest.fn(),
    handleWebhook: jest.fn(),
    getAllPayments: jest.fn(),
    refund: jest.fn(),
    expireAbandonedPayments: jest.fn(),
  };
}

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: ReturnType<typeof createMockPaymentsService>;

  const userId = 'user123';

  beforeEach(async () => {
    service = createMockPaymentsService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: service }],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ============================================
  // CUSTOMER ENDPOINTS
  // ============================================

  describe('createPaymentIntent', () => {
    it('should call paymentsService.createPaymentIntent with userId and DTO', async () => {
      const dto = { orderId: 'order1' };
      const expected = { clientSecret: 'pi_test_secret', paymentIntentId: 'pi_test' };
      service.createPaymentIntent.mockResolvedValue(expected);

      const result = await controller.createPaymentIntent(userId, dto as any);

      expect(service.createPaymentIntent).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('getPaymentByOrderId', () => {
    it('should call paymentsService.getPaymentByOrderId with orderId and userId', async () => {
      const orderId = 'order1';
      const expected = { id: 'pay1', status: 'SUCCEEDED' };
      service.getPaymentByOrderId.mockResolvedValue(expected);

      const result = await controller.getPaymentByOrderId(userId, orderId);

      // Argument reordering: (userId, orderId) → (orderId, userId)
      expect(service.getPaymentByOrderId).toHaveBeenCalledWith(orderId, userId);
      expect(result).toEqual(expected);
    });
  });

  // ============================================
  // WEBHOOK
  // ============================================

  describe('handleWebhook', () => {
    it('should pass rawBody and stripe-signature to paymentsService', async () => {
      const rawBody = Buffer.from('{"type":"payment_intent.succeeded"}');
      const signature = 'whsec_test_sig';
      const req = { rawBody } as RawBodyRequest<Request>;
      const expected = { received: true as const };
      service.handleWebhook.mockResolvedValue(expected);

      const result = await controller.handleWebhook(req, signature);

      expect(service.handleWebhook).toHaveBeenCalledWith(rawBody, signature);
      expect(result).toEqual(expected);
    });
  });

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  describe('getAllPayments', () => {
    it('should call paymentsService.getAllPayments with query', async () => {
      const query = { page: 1, limit: 10, sortOrder: 'desc' as const };
      const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      service.getAllPayments.mockResolvedValue(expected);

      const result = await controller.getAllPayments(query as any);

      expect(service.getAllPayments).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('refund', () => {
    it('should call paymentsService.refund with paymentId and DTO', async () => {
      const paymentId = 'pay1';
      const dto = { amount: '25.00' };
      const expected = { id: paymentId, status: 'REFUND_PENDING' };
      service.refund.mockResolvedValue(expected);

      const result = await controller.refund(paymentId, dto as any);

      expect(service.refund).toHaveBeenCalledWith(paymentId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('expireAbandonedPayments', () => {
    it('should call paymentsService.expireAbandonedPayments with no args', async () => {
      const expected = { expired: 3 };
      service.expireAbandonedPayments.mockResolvedValue(expected);

      const result = await controller.expireAbandonedPayments();

      expect(service.expireAbandonedPayments).toHaveBeenCalledWith();
      expect(result).toEqual(expected);
    });
  });
});
