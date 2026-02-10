import { Test, type TestingModule } from '@nestjs/testing';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';

function createMockCouponsService(): Record<keyof CouponsService, jest.Mock> {
  return {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
    hardDelete: jest.fn(),
    validateCoupon: jest.fn(),
  };
}

describe('CouponsController', () => {
  let controller: CouponsController;
  let service: ReturnType<typeof createMockCouponsService>;

  const userId = 'user123';

  beforeEach(async () => {
    service = createMockCouponsService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CouponsController],
      providers: [{ provide: CouponsService, useValue: service }],
    }).compile();

    controller = module.get<CouponsController>(CouponsController);
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

  describe('validateCoupon', () => {
    it('should call couponsService.validateCoupon with code, userId, and parsed subtotal', async () => {
      const code = 'SUMMER20';
      const subtotal = '150.00';
      const expected = { valid: true, discountAmount: '30.00' };
      service.validateCoupon.mockResolvedValue(expected);

      const result = await controller.validateCoupon(code, subtotal, userId);

      // Controller reorders args and converts subtotal string → number via parseFloat
      expect(service.validateCoupon).toHaveBeenCalledWith(code, userId, 150);
      expect(result).toEqual(expected);
    });
  });

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  describe('create', () => {
    it('should call couponsService.create with DTO', async () => {
      const dto = { code: 'SUMMER20', type: 'PERCENTAGE', discountValue: '20' };
      const expected = { id: 'coupon1', code: 'SUMMER20' };
      service.create.mockResolvedValue(expected);

      const result = await controller.create(dto as any);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should call couponsService.findAll with query', async () => {
      const query = { page: 1, limit: 10, sortOrder: 'desc' as const };
      const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      service.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findById', () => {
    it('should call couponsService.findById with id', async () => {
      const id = 'coupon1';
      const expected = { id, code: 'SUMMER20' };
      service.findById.mockResolvedValue(expected);

      const result = await controller.findById(id);

      expect(service.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should call couponsService.update with id and DTO', async () => {
      const id = 'coupon1';
      const dto = { discountValue: '25' };
      const expected = { id, discountValue: '25' };
      service.update.mockResolvedValue(expected);

      const result = await controller.update(id, dto as any);

      expect(service.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('deactivate', () => {
    it('should call couponsService.deactivate with id', async () => {
      const id = 'coupon1';
      const expected = { message: 'Coupon deactivated' };
      service.deactivate.mockResolvedValue(expected);

      const result = await controller.deactivate(id);

      expect(service.deactivate).toHaveBeenCalledWith(id);
      expect(result).toEqual(expected);
    });
  });

  describe('hardDelete', () => {
    it('should call couponsService.hardDelete with id', async () => {
      const id = 'coupon1';
      const expected = { message: 'Coupon deleted' };
      service.hardDelete.mockResolvedValue(expected);

      const result = await controller.hardDelete(id);

      expect(service.hardDelete).toHaveBeenCalledWith(id);
      expect(result).toEqual(expected);
    });
  });
});
