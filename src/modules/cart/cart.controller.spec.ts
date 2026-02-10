import { Test, type TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

function createMockCartService(): Record<keyof CartService, jest.Mock> {
  return {
    getCart: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
    applyCoupon: jest.fn(),
    removeCoupon: jest.fn(),
  };
}

describe('CartController', () => {
  let controller: CartController;
  let service: ReturnType<typeof createMockCartService>;

  const userId = 'user123';

  beforeEach(async () => {
    service = createMockCartService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [{ provide: CartService, useValue: service }],
    }).compile();

    controller = module.get<CartController>(CartController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCart', () => {
    it('should call cartService.getCart with userId', async () => {
      const expected = { items: [], subtotal: '0.00' };
      service.getCart.mockResolvedValue(expected);

      const result = await controller.getCart(userId);

      expect(service.getCart).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expected);
    });
  });

  describe('addItem', () => {
    it('should call cartService.addItem with userId and DTO', async () => {
      const dto = { productId: 'prod1', quantity: 2 };
      const expected = { items: [{ productId: 'prod1', quantity: 2 }] };
      service.addItem.mockResolvedValue(expected);

      const result = await controller.addItem(userId, dto as any);

      expect(service.addItem).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('updateItem', () => {
    it('should call cartService.updateItem with userId, itemId, and DTO', async () => {
      const itemId = 'item1';
      const dto = { quantity: 5 };
      const expected = { items: [{ id: itemId, quantity: 5 }] };
      service.updateItem.mockResolvedValue(expected);

      const result = await controller.updateItem(userId, itemId, dto as any);

      expect(service.updateItem).toHaveBeenCalledWith(userId, itemId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('removeItem', () => {
    it('should call cartService.removeItem with userId and itemId', async () => {
      const itemId = 'item1';
      const expected = { items: [] };
      service.removeItem.mockResolvedValue(expected);

      const result = await controller.removeItem(userId, itemId);

      expect(service.removeItem).toHaveBeenCalledWith(userId, itemId);
      expect(result).toEqual(expected);
    });
  });

  describe('clearCart', () => {
    it('should call cartService.clearCart with userId', async () => {
      const expected = { items: [], subtotal: '0.00' };
      service.clearCart.mockResolvedValue(expected);

      const result = await controller.clearCart(userId);

      expect(service.clearCart).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expected);
    });
  });

  describe('applyCoupon', () => {
    it('should call cartService.applyCoupon with userId and dto.code', async () => {
      const dto = { code: 'SAVE10' };
      const expected = { items: [], couponCode: 'SAVE10', discountAmount: '10.00' };
      service.applyCoupon.mockResolvedValue(expected);

      const result = await controller.applyCoupon(userId, dto as any);

      // Controller extracts dto.code — passes the string, not the whole DTO
      expect(service.applyCoupon).toHaveBeenCalledWith(userId, 'SAVE10');
      expect(result).toEqual(expected);
    });
  });

  describe('removeCoupon', () => {
    it('should call cartService.removeCoupon with userId', async () => {
      const expected = { items: [], couponCode: null };
      service.removeCoupon.mockResolvedValue(expected);

      const result = await controller.removeCoupon(userId);

      expect(service.removeCoupon).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expected);
    });
  });
});
