import { Test, type TestingModule } from '@nestjs/testing';
import { ShippingService } from './shipping.service';
import { createMockPrismaClient, resetMockPrismaClient } from '@test/mocks/prisma.mock';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ShippingService', () => {
  let service: ShippingService;
  let prisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(async () => {
    prisma = createMockPrismaClient();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ShippingService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ShippingService>(ShippingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    resetMockPrismaClient(prisma);
  });

  const methodId = 'clship123456789012345678';

  const mockShippingMethod = {
    id: methodId,
    name: 'Standard Shipping',
    description: '5-7 business days',
    basePrice: 9.99,
    freeShippingThreshold: 100,
    estimatedDays: 7,
    sortOrder: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findActive', () => {
    it('should return only active shipping methods sorted by sortOrder', async () => {
      prisma.shippingMethod.findMany.mockResolvedValue([mockShippingMethod]);

      const result = await service.findActive();

      expect(result).toEqual([mockShippingMethod]);
      expect(prisma.shippingMethod.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: expect.objectContaining({ id: true, name: true, basePrice: true }),
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('calculateShipping', () => {
    it('should return basePrice when subtotal is below free shipping threshold', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue({
        name: 'Standard Shipping',
        basePrice: 9.99,
        freeShippingThreshold: 100,
        isActive: true,
      });

      const result = await service.calculateShipping(methodId, 50);

      expect(result).toEqual({ shippingCost: 9.99, methodName: 'Standard Shipping' });
    });

    it('should return 0 when subtotal meets the free shipping threshold exactly', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue({
        name: 'Standard Shipping',
        basePrice: 9.99,
        freeShippingThreshold: 100,
        isActive: true,
      });

      const result = await service.calculateShipping(methodId, 100);

      expect(result).toEqual({ shippingCost: 0, methodName: 'Standard Shipping' });
    });

    it('should return 0 when subtotal exceeds the free shipping threshold', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue({
        name: 'Standard Shipping',
        basePrice: 9.99,
        freeShippingThreshold: 100,
        isActive: true,
      });

      const result = await service.calculateShipping(methodId, 250);

      expect(result).toEqual({ shippingCost: 0, methodName: 'Standard Shipping' });
    });

    it('should always charge basePrice when freeShippingThreshold is null', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue({
        name: 'Express Shipping',
        basePrice: 19.99,
        freeShippingThreshold: null,
        isActive: true,
      });

      const result = await service.calculateShipping(methodId, 9999);

      expect(result).toEqual({ shippingCost: 19.99, methodName: 'Express Shipping' });
    });

    it('should throw NotFoundException when method does not exist', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue(null);

      await expect(service.calculateShipping('nonexistent', 100)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when method is inactive', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue({
        name: 'Old Method',
        basePrice: 5,
        freeShippingThreshold: null,
        isActive: false,
      });

      await expect(service.calculateShipping(methodId, 100)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'Standard Shipping',
      basePrice: '9.99',
      estimatedDays: 7,
    };

    it('should create shipping method successfully', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue(null);
      prisma.shippingMethod.create.mockResolvedValue(mockShippingMethod);

      const result = await service.create(createDto as never);

      expect(result).toEqual(mockShippingMethod);
    });

    it('should throw BadRequestException when name already exists', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.create(createDto as never)).rejects.toThrow(BadRequestException);

      expect(prisma.shippingMethod.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all shipping methods sorted by sortOrder', async () => {
      prisma.shippingMethod.findMany.mockResolvedValue([mockShippingMethod]);

      const result = await service.findAll();

      expect(result).toEqual([mockShippingMethod]);
      expect(prisma.shippingMethod.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({ id: true }),
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('findById', () => {
    it('should return shipping method by id', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue(mockShippingMethod);

      const result = await service.findById(methodId);

      expect(result).toEqual(mockShippingMethod);
    });

    it('should throw NotFoundException when method does not exist', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update shipping method successfully', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue({ id: methodId });
      const updated = { ...mockShippingMethod, description: 'Updated' };
      prisma.shippingMethod.update.mockResolvedValue(updated);

      const result = await service.update(methodId, { description: 'Updated' } as never);

      expect(result).toEqual(updated);
    });

    it('should allow renaming when new name is not taken', async () => {
      prisma.shippingMethod.findUnique
        .mockResolvedValueOnce({ id: methodId })
        .mockResolvedValueOnce(null);
      prisma.shippingMethod.update.mockResolvedValue({
        ...mockShippingMethod,
        name: 'New Name',
      });

      const result = await service.update(methodId, { name: 'New Name' } as never);

      expect(result.name).toBe('New Name');
    });

    it('should throw BadRequestException when new name is taken by another method', async () => {
      prisma.shippingMethod.findUnique
        .mockResolvedValueOnce({ id: methodId })
        .mockResolvedValueOnce({ id: 'other-method-id' });

      await expect(service.update(methodId, { name: 'Taken' } as never)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.shippingMethod.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when method does not exist', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', { description: 'x' } as never)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate an active method', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue({ id: methodId, isActive: true });
      prisma.shippingMethod.update.mockResolvedValue({} as never);

      const result = await service.deactivate(methodId);

      expect(result).toEqual({ message: 'Shipping method deactivated successfully' });
    });

    it('should throw BadRequestException when already deactivated', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue({ id: methodId, isActive: false });

      await expect(service.deactivate(methodId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when method does not exist', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue(null);

      await expect(service.deactivate('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete method', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue({ id: methodId });
      prisma.shippingMethod.delete.mockResolvedValue({} as never);

      const result = await service.hardDelete(methodId);

      expect(result).toEqual({ message: 'Shipping method permanently deleted' });
    });

    it('should throw NotFoundException when method does not exist', async () => {
      prisma.shippingMethod.findUnique.mockResolvedValue(null);

      await expect(service.hardDelete('nonexistent')).rejects.toThrow(NotFoundException);

      expect(prisma.shippingMethod.delete).not.toHaveBeenCalled();
    });
  });
});
