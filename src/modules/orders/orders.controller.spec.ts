import { Test, type TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

function createMockOrdersService(): Record<keyof OrdersService, jest.Mock> {
  return {
    checkout: jest.fn(),
    getMyOrders: jest.fn(),
    getOrderById: jest.fn(),
    cancelOrder: jest.fn(),
    requestRefund: jest.fn(),
    getRefundRequest: jest.fn(),
    getAllOrders: jest.fn(),
    updateOrderStatus: jest.fn(),
  };
}

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: ReturnType<typeof createMockOrdersService>;

  const userId = 'user123';

  beforeEach(async () => {
    service = createMockOrdersService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: service }],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
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

  describe('checkout', () => {
    it('should call ordersService.checkout with userId and DTO', async () => {
      const dto = { shippingAddressId: 'addr1', shippingMethodId: 'ship1' };
      const expected = { id: 'order1', orderNumber: 'ORD-20240101-0001' };
      service.checkout.mockResolvedValue(expected);

      const result = await controller.checkout(userId, dto as any);

      expect(service.checkout).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('getMyOrders', () => {
    it('should call ordersService.getMyOrders with userId and query', async () => {
      const query = { page: 1, limit: 10, sortOrder: 'desc' as const };
      const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      service.getMyOrders.mockResolvedValue(expected);

      const result = await controller.getMyOrders(userId, query as any);

      expect(service.getMyOrders).toHaveBeenCalledWith(userId, query);
      expect(result).toEqual(expected);
    });
  });

  describe('getMyOrderById', () => {
    it('should call ordersService.getOrderById with orderId and userId', async () => {
      const orderId = 'order1';
      const expected = { id: orderId, orderNumber: 'ORD-20240101-0001' };
      service.getOrderById.mockResolvedValue(expected);

      const result = await controller.getMyOrderById(userId, orderId);

      // Controller reorders args: receives (userId, orderId) → passes (orderId, userId)
      expect(service.getOrderById).toHaveBeenCalledWith(orderId, userId);
      expect(result).toEqual(expected);
    });
  });

  describe('cancelOrder', () => {
    it('should call ordersService.cancelOrder with orderId and userId', async () => {
      const orderId = 'order1';
      const expected = { id: orderId, status: 'CANCELLED' };
      service.cancelOrder.mockResolvedValue(expected);

      const result = await controller.cancelOrder(userId, orderId);

      // Same reordering: (userId, orderId) → (orderId, userId)
      expect(service.cancelOrder).toHaveBeenCalledWith(orderId, userId);
      expect(result).toEqual(expected);
    });
  });

  describe('requestRefund', () => {
    it('should call ordersService.requestRefund with orderId, userId, and dto.reason', async () => {
      const orderId = 'order1';
      const dto = { reason: 'Product arrived damaged' };
      const expected = { id: 'refund1', status: 'PENDING' };
      service.requestRefund.mockResolvedValue(expected);

      const result = await controller.requestRefund(userId, orderId, dto as any);

      // Controller extracts dto.reason and reorders args
      expect(service.requestRefund).toHaveBeenCalledWith(orderId, userId, dto.reason);
      expect(result).toEqual(expected);
    });
  });

  describe('getRefundRequest', () => {
    it('should call ordersService.getRefundRequest with orderId and userId', async () => {
      const orderId = 'order1';
      const expected = { id: 'refund1', status: 'PENDING', reason: 'Damaged' };
      service.getRefundRequest.mockResolvedValue(expected);

      const result = await controller.getRefundRequest(userId, orderId);

      expect(service.getRefundRequest).toHaveBeenCalledWith(orderId, userId);
      expect(result).toEqual(expected);
    });
  });

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  describe('getAllOrders', () => {
    it('should call ordersService.getAllOrders with query', async () => {
      const query = { page: 1, limit: 10, sortOrder: 'desc' as const };
      const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      service.getAllOrders.mockResolvedValue(expected);

      const result = await controller.getAllOrders(query as any);

      expect(service.getAllOrders).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('getOrderById (admin)', () => {
    it('should call ordersService.getOrderById with orderId only', async () => {
      const orderId = 'order1';
      const expected = { id: orderId, orderNumber: 'ORD-20240101-0001' };
      service.getOrderById.mockResolvedValue(expected);

      const result = await controller.getOrderById(orderId);

      // Admin version: no userId — sees any order
      expect(service.getOrderById).toHaveBeenCalledWith(orderId);
      expect(result).toEqual(expected);
    });
  });

  describe('updateOrderStatus', () => {
    it('should call ordersService.updateOrderStatus with orderId and DTO', async () => {
      const orderId = 'order1';
      const dto = { status: 'SHIPPED' };
      const expected = { id: orderId, status: 'SHIPPED' };
      service.updateOrderStatus.mockResolvedValue(expected);

      const result = await controller.updateOrderStatus(orderId, dto as any);

      expect(service.updateOrderStatus).toHaveBeenCalledWith(orderId, dto);
      expect(result).toEqual(expected);
    });
  });
});
