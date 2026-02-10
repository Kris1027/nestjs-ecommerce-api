import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { GuestCartController } from './guest-cart.controller';
import { GuestCartService } from './guest-cart.service';

function createMockGuestCartService(): Record<keyof GuestCartService, jest.Mock> {
  return {
    getCart: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
    mergeIntoUserCart: jest.fn(),
  };
}

function createMockResponse(): Response {
  return {
    setHeader: jest.fn(),
  } as unknown as Response;
}

describe('GuestCartController', () => {
  let controller: GuestCartController;
  let service: ReturnType<typeof createMockGuestCartService>;

  const token = 'guest-token-123';

  beforeEach(async () => {
    service = createMockGuestCartService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestCartController],
      providers: [{ provide: GuestCartService, useValue: service }],
    }).compile();

    controller = module.get<GuestCartController>(GuestCartController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCart', () => {
    it('should call guestCartService.getCart with token', async () => {
      const expected = { items: [], subtotal: '0.00' };
      service.getCart.mockResolvedValue(expected);

      const result = await controller.getCart(token);

      expect(service.getCart).toHaveBeenCalledWith(token);
      expect(result).toEqual(expected);
    });

    it('should throw BadRequestException when token is missing', () => {
      expect(() => controller.getCart(undefined)).toThrow(BadRequestException);
    });
  });

  describe('addItem', () => {
    it('should set token in response header and strip it from body', async () => {
      const dto = { productId: 'prod1', quantity: 1 };
      const res = createMockResponse();
      const serviceResult = {
        token: 'new-token',
        items: [{ productId: 'prod1', quantity: 1 }],
        subtotal: '9.99',
      };
      service.addItem.mockResolvedValue(serviceResult);

      const result = await controller.addItem(token, dto as any, res);

      // Service receives token (not undefined)
      expect(service.addItem).toHaveBeenCalledWith(token, dto);
      // Token goes into the response header
      expect(res.setHeader).toHaveBeenCalledWith('x-guest-cart-token', 'new-token');
      // Token is stripped from the returned body
      expect(result).toEqual({
        items: [{ productId: 'prod1', quantity: 1 }],
        subtotal: '9.99',
      });
      expect(result).not.toHaveProperty('token');
    });

    it('should pass null when no token header is provided', async () => {
      const dto = { productId: 'prod1', quantity: 1 };
      const res = createMockResponse();
      service.addItem.mockResolvedValue({ token: 'new-token' });

      await controller.addItem(undefined, dto as any, res);

      // Controller coerces undefined → null for new cart creation
      expect(service.addItem).toHaveBeenCalledWith(null, dto);
    });
  });

  describe('updateItem', () => {
    it('should call guestCartService.updateItem with token, itemId, and DTO', async () => {
      const itemId = 'item1';
      const dto = { quantity: 3 };
      const expected = { items: [{ id: itemId, quantity: 3 }] };
      service.updateItem.mockResolvedValue(expected);

      const result = await controller.updateItem(token, itemId, dto as any);

      expect(service.updateItem).toHaveBeenCalledWith(token, itemId, dto);
      expect(result).toEqual(expected);
    });

    it('should throw BadRequestException when token is missing', () => {
      expect(() => controller.updateItem(undefined, 'item1', {} as any)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeItem', () => {
    it('should call guestCartService.removeItem with token and itemId', async () => {
      const itemId = 'item1';
      const expected = { items: [] };
      service.removeItem.mockResolvedValue(expected);

      const result = await controller.removeItem(token, itemId);

      expect(service.removeItem).toHaveBeenCalledWith(token, itemId);
      expect(result).toEqual(expected);
    });

    it('should throw BadRequestException when token is missing', () => {
      expect(() => controller.removeItem(undefined, 'item1')).toThrow(BadRequestException);
    });
  });

  describe('clearCart', () => {
    it('should call guestCartService.clearCart with token', async () => {
      const expected = { items: [], subtotal: '0.00' };
      service.clearCart.mockResolvedValue(expected);

      const result = await controller.clearCart(token);

      expect(service.clearCart).toHaveBeenCalledWith(token);
      expect(result).toEqual(expected);
    });

    it('should throw BadRequestException when token is missing', () => {
      expect(() => controller.clearCart(undefined)).toThrow(BadRequestException);
    });
  });
});
