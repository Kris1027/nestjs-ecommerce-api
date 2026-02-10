import { Test, type TestingModule } from '@nestjs/testing';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';

function createMockShippingService(): Record<keyof ShippingService, jest.Mock> {
  return {
    findActive: jest.fn(),
    calculateShipping: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
    hardDelete: jest.fn(),
  };
}

describe('ShippingController', () => {
  let controller: ShippingController;
  let service: ReturnType<typeof createMockShippingService>;

  beforeEach(async () => {
    service = createMockShippingService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShippingController],
      providers: [{ provide: ShippingService, useValue: service }],
    }).compile();

    controller = module.get<ShippingController>(ShippingController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  describe('findActive', () => {
    it('should call shippingService.findActive', async () => {
      const expected = [{ id: 'ship1', name: 'Standard', basePrice: '9.99' }];
      service.findActive.mockResolvedValue(expected);

      const result = await controller.findActive();

      expect(service.findActive).toHaveBeenCalledWith();
      expect(result).toEqual(expected);
    });
  });

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  describe('create', () => {
    it('should call shippingService.create with DTO', async () => {
      const dto = { name: 'Express', basePrice: '19.99' };
      const expected = { id: 'ship1', ...dto };
      service.create.mockResolvedValue(expected);

      const result = await controller.create(dto as any);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should call shippingService.findAll', async () => {
      const expected = [{ id: 'ship1', name: 'Standard', isActive: true }];
      service.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(expected);
    });
  });

  describe('findById', () => {
    it('should call shippingService.findById with id', async () => {
      const id = 'ship1';
      const expected = { id, name: 'Standard' };
      service.findById.mockResolvedValue(expected);

      const result = await controller.findById(id);

      expect(service.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should call shippingService.update with id and DTO', async () => {
      const id = 'ship1';
      const dto = { basePrice: '14.99' };
      const expected = { id, basePrice: '14.99' };
      service.update.mockResolvedValue(expected);

      const result = await controller.update(id, dto as any);

      expect(service.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('deactivate', () => {
    it('should call shippingService.deactivate with id', async () => {
      const id = 'ship1';
      const expected = { message: 'Shipping method deactivated' };
      service.deactivate.mockResolvedValue(expected);

      const result = await controller.deactivate(id);

      expect(service.deactivate).toHaveBeenCalledWith(id);
      expect(result).toEqual(expected);
    });
  });

  describe('hardDelete', () => {
    it('should call shippingService.hardDelete with id', async () => {
      const id = 'ship1';
      const expected = { message: 'Shipping method deleted' };
      service.hardDelete.mockResolvedValue(expected);

      const result = await controller.hardDelete(id);

      expect(service.hardDelete).toHaveBeenCalledWith(id);
      expect(result).toEqual(expected);
    });
  });
});
