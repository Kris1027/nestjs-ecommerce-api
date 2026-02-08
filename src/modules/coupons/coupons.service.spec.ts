import { Test, type TestingModule } from '@nestjs/testing';
import { CouponsService } from './coupons.service';
import { createMockPrismaClient, resetMockPrismaClient } from '@test/mocks/prisma.mock';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CouponsService', () => {
  let service: CouponsService;
  let prisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(async () => {
    prisma = createMockPrismaClient();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CouponsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    resetMockPrismaClient(prisma);
  });

  const mockCoupon = {
    id: 'clcoup123456789012345678',
    code: 'SAVE20',
    description: '20% off your order',
    type: 'PERCENTAGE',
    value: 20,
    minimumOrderAmount: 50,
    maximumDiscount: 100,
    usageLimit: 1000,
    usageLimitPerUser: 1,
    usageCount: 5,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2026-12-31'),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      code: 'SAVE20',
      type: 'PERCENTAGE' as const,
      value: 20,
      validFrom: new Date('2025-01-01').toISOString(),
      validUntil: new Date('2026-12-31').toISOString(),
    };

    it('should create a coupon successfully', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);
      prisma.coupon.create.mockResolvedValue(mockCoupon);

      const result = await service.create(createDto as never);

      expect(result).toEqual(mockCoupon);
      expect(prisma.coupon.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ code: 'SAVE20', type: 'PERCENTAGE' }),
        select: expect.objectContaining({ id: true, code: true }),
      });
    });

    it('should throw BadRequestException when code already exists', async () => {
      prisma.coupon.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createDto as never)).rejects.toThrow(BadRequestException);

      expect(prisma.coupon.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return coupon by id', async () => {
      prisma.coupon.findUnique.mockResolvedValue(mockCoupon);

      const result = await service.findById(mockCoupon.id);

      expect(result).toEqual(mockCoupon);
      expect(prisma.coupon.findUnique).toHaveBeenCalledWith({
        where: { id: mockCoupon.id },
        select: expect.objectContaining({ id: true, code: true }),
      });
    });

    it('should throw NotFoundException when coupon does not exist', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated coupons', async () => {
      prisma.coupon.findMany.mockResolvedValue([mockCoupon]);
      prisma.coupon.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data).toEqual([mockCoupon]);
      expect(result.meta).toEqual(expect.objectContaining({ total: 1, page: 1 }));
    });

    it('should filter by isActive', async () => {
      prisma.coupon.findMany.mockResolvedValue([]);
      prisma.coupon.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, sortOrder: 'desc', isActive: true });

      expect(prisma.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should filter by type', async () => {
      prisma.coupon.findMany.mockResolvedValue([]);
      prisma.coupon.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, sortOrder: 'desc', type: 'PERCENTAGE' });

      expect(prisma.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'PERCENTAGE' }),
        }),
      );
    });

    it('should filter by validNow', async () => {
      prisma.coupon.findMany.mockResolvedValue([]);
      prisma.coupon.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, sortOrder: 'desc', validNow: true });

      expect(prisma.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            validFrom: expect.objectContaining({ lte: expect.any(Date) }),
            validUntil: expect.objectContaining({ gte: expect.any(Date) }),
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update coupon successfully', async () => {
      prisma.coupon.findUnique.mockResolvedValue({ id: mockCoupon.id });
      const updated = { ...mockCoupon, description: 'Updated description' };
      prisma.coupon.update.mockResolvedValue(updated);

      const result = await service.update(mockCoupon.id, {
        description: 'Updated description',
      } as never);

      expect(result).toEqual(updated);
      expect(prisma.coupon.update).toHaveBeenCalledWith({
        where: { id: mockCoupon.id },
        data: { description: 'Updated description' },
        select: expect.objectContaining({ id: true, code: true }),
      });
    });

    it('should allow updating code when new code is not taken', async () => {
      prisma.coupon.findUnique
        .mockResolvedValueOnce({ id: mockCoupon.id })
        .mockResolvedValueOnce(null);
      prisma.coupon.update.mockResolvedValue({ ...mockCoupon, code: 'NEWCODE' });

      const result = await service.update(mockCoupon.id, { code: 'NEWCODE' } as never);

      expect(result.code).toBe('NEWCODE');
    });

    it('should allow updating code to same value (own coupon)', async () => {
      prisma.coupon.findUnique
        .mockResolvedValueOnce({ id: mockCoupon.id })
        .mockResolvedValueOnce({ id: mockCoupon.id });
      prisma.coupon.update.mockResolvedValue(mockCoupon);

      const result = await service.update(mockCoupon.id, { code: 'SAVE20' } as never);

      expect(result).toEqual(mockCoupon);
    });

    it('should throw BadRequestException when new code is taken by another coupon', async () => {
      prisma.coupon.findUnique
        .mockResolvedValueOnce({ id: mockCoupon.id })
        .mockResolvedValueOnce({ id: 'other-coupon-id' });

      await expect(service.update(mockCoupon.id, { code: 'TAKEN' } as never)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.coupon.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when coupon does not exist', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', { description: 'x' } as never)).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.coupon.update).not.toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should deactivate an active coupon', async () => {
      prisma.coupon.findUnique.mockResolvedValue({ id: mockCoupon.id, isActive: true });
      prisma.coupon.update.mockResolvedValue({} as never);

      const result = await service.deactivate(mockCoupon.id);

      expect(result).toEqual({ message: 'Coupon deactivated successfully' });
      expect(prisma.coupon.update).toHaveBeenCalledWith({
        where: { id: mockCoupon.id },
        data: { isActive: false },
      });
    });

    it('should throw BadRequestException when coupon is already deactivated', async () => {
      prisma.coupon.findUnique.mockResolvedValue({ id: mockCoupon.id, isActive: false });

      await expect(service.deactivate(mockCoupon.id)).rejects.toThrow(BadRequestException);

      expect(prisma.coupon.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when coupon does not exist', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);

      await expect(service.deactivate('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete coupon', async () => {
      prisma.coupon.findUnique.mockResolvedValue({ id: mockCoupon.id });
      prisma.coupon.delete.mockResolvedValue({} as never);

      const result = await service.hardDelete(mockCoupon.id);

      expect(result).toEqual({ message: 'Coupon permanently deleted' });
      expect(prisma.coupon.delete).toHaveBeenCalledWith({ where: { id: mockCoupon.id } });
    });

    it('should throw NotFoundException when coupon does not exist', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);

      await expect(service.hardDelete('nonexistent')).rejects.toThrow(NotFoundException);

      expect(prisma.coupon.delete).not.toHaveBeenCalled();
    });
  });

  describe('validateCoupon', () => {
    const validCoupon = {
      id: 'clcoup123456789012345678',
      code: 'SAVE20',
      type: 'PERCENTAGE',
      value: 20,
      isActive: true,
      validFrom: new Date('2025-01-01'),
      validUntil: new Date('2027-12-31'),
      usageLimit: 100,
      usageLimitPerUser: 2,
      usageCount: 5,
      minimumOrderAmount: 50,
      maximumDiscount: 30,
    };

    const userId = 'cluser123456789012345678';

    it('should validate and return percentage discount capped by maximumDiscount', async () => {
      prisma.coupon.findUnique.mockResolvedValue(validCoupon);
      prisma.couponUsage.count.mockResolvedValue(0);

      const result = await service.validateCoupon('save20', userId, 200);

      expect(result).toEqual({
        couponId: validCoupon.id,
        discountAmount: 30,
      });
    });

    it('should return uncapped percentage discount when under maximum', async () => {
      prisma.coupon.findUnique.mockResolvedValue(validCoupon);
      prisma.couponUsage.count.mockResolvedValue(0);

      const result = await service.validateCoupon('SAVE20', userId, 100);

      expect(result).toEqual({
        couponId: validCoupon.id,
        discountAmount: 20,
      });
    });

    it('should return fixed amount discount', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...validCoupon,
        type: 'FIXED_AMOUNT',
        value: 15,
        maximumDiscount: null,
      });
      prisma.couponUsage.count.mockResolvedValue(0);

      const result = await service.validateCoupon('SAVE20', userId, 200);

      expect(result).toEqual({
        couponId: validCoupon.id,
        discountAmount: 15,
      });
    });

    it('should cap discount at subtotal to prevent negative totals', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...validCoupon,
        type: 'FIXED_AMOUNT',
        value: 100,
        maximumDiscount: null,
        minimumOrderAmount: null,
      });
      prisma.couponUsage.count.mockResolvedValue(0);

      const result = await service.validateCoupon('SAVE20', userId, 60);

      expect(result).toEqual({
        couponId: validCoupon.id,
        discountAmount: 60,
      });
    });

    it('should uppercase the code before lookup', async () => {
      prisma.coupon.findUnique.mockResolvedValue(validCoupon);
      prisma.couponUsage.count.mockResolvedValue(0);

      await service.validateCoupon('save20', userId, 200);

      expect(prisma.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'SAVE20' },
      });
    });

    it('should throw NotFoundException when coupon code does not exist', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);

      await expect(service.validateCoupon('INVALID', userId, 200)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when coupon is inactive', async () => {
      prisma.coupon.findUnique.mockResolvedValue({ ...validCoupon, isActive: false });

      await expect(service.validateCoupon('SAVE20', userId, 200)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when coupon is not yet valid', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...validCoupon,
        validFrom: new Date('2099-01-01'),
      });

      await expect(service.validateCoupon('SAVE20', userId, 200)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when coupon has expired', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...validCoupon,
        validUntil: new Date('2020-01-01'),
      });

      await expect(service.validateCoupon('SAVE20', userId, 200)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when global usage limit is reached', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...validCoupon,
        usageLimit: 10,
        usageCount: 10,
      });

      await expect(service.validateCoupon('SAVE20', userId, 200)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should skip global usage check when usageLimit is null', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...validCoupon,
        usageLimit: null,
        usageCount: 9999,
      });
      prisma.couponUsage.count.mockResolvedValue(0);

      const result = await service.validateCoupon('SAVE20', userId, 200);
      expect(result.couponId).toBe(validCoupon.id);
    });

    it('should throw BadRequestException when per-user usage limit is reached', async () => {
      prisma.coupon.findUnique.mockResolvedValue(validCoupon);
      prisma.couponUsage.count.mockResolvedValue(2);

      await expect(service.validateCoupon('SAVE20', userId, 200)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should skip per-user usage check when usageLimitPerUser is null', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...validCoupon,
        usageLimitPerUser: null,
      });

      const result = await service.validateCoupon('SAVE20', userId, 200);
      expect(result.couponId).toBe(validCoupon.id);
      expect(prisma.couponUsage.count).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when subtotal is below minimum order amount', async () => {
      prisma.coupon.findUnique.mockResolvedValue(validCoupon);
      prisma.couponUsage.count.mockResolvedValue(0);

      await expect(service.validateCoupon('SAVE20', userId, 30)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should skip minimum order check when minimumOrderAmount is null', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...validCoupon,
        minimumOrderAmount: null,
      });
      prisma.couponUsage.count.mockResolvedValue(0);

      const result = await service.validateCoupon('SAVE20', userId, 5);
      expect(result.couponId).toBe(validCoupon.id);
    });
  });
});
