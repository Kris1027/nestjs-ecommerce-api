import { Test, type TestingModule } from '@nestjs/testing';
import { TaxService } from './tax.service';
import { createMockPrismaClient, resetMockPrismaClient } from '@test/mocks/prisma.mock';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('TaxService', () => {
  let service: TaxService;
  let prisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(async () => {
    prisma = createMockPrismaClient();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<TaxService>(TaxService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    resetMockPrismaClient(prisma);
  });

  const mockTaxRate = {
    id: 'cltax1234567890123456789',
    name: 'VAT 23%',
    rate: 0.23,
    isDefault: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateTax', () => {
    it('should calculate tax using the default active rate', async () => {
      prisma.taxRate.findFirst.mockResolvedValue({ rate: 0.23 });

      const result = await service.calculateTax(100);

      expect(result).toEqual({ tax: 23, rate: '0.23' });
      expect(prisma.taxRate.findFirst).toHaveBeenCalledWith({
        where: { isDefault: true, isActive: true },
        select: { rate: true },
      });
    });

    it('should round tax to 2 decimal places', async () => {
      prisma.taxRate.findFirst.mockResolvedValue({ rate: 0.23 });

      const result = await service.calculateTax(199.99);

      expect(result.tax).toBe(46);
    });

    it('should return zero tax when no default rate exists', async () => {
      prisma.taxRate.findFirst.mockResolvedValue(null);

      const result = await service.calculateTax(100);

      expect(result).toEqual({ tax: 0, rate: null });
    });
  });

  describe('create', () => {
    it('should unset existing defaults when creating a new default rate', async () => {
      prisma.taxRate.updateMany.mockResolvedValue({ count: 1 });
      prisma.taxRate.create.mockResolvedValue(mockTaxRate);

      const result = await service.create({
        name: 'VAT 23%',
        rate: '0.23',
        isDefault: true,
      } as never);

      expect(result).toEqual(mockTaxRate);
      expect(prisma.taxRate.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    });

    it('should skip unsetting defaults when isDefault is false', async () => {
      prisma.taxRate.create.mockResolvedValue({ ...mockTaxRate, isDefault: false });

      await service.create({
        name: 'Reduced VAT',
        rate: '0.08',
        isDefault: false,
      } as never);

      expect(prisma.taxRate.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all tax rates ordered by createdAt desc', async () => {
      prisma.taxRate.findMany.mockResolvedValue([mockTaxRate]);

      const result = await service.findAll();

      expect(result).toEqual([mockTaxRate]);
      expect(prisma.taxRate.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({ id: true, rate: true }),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return tax rate by id', async () => {
      prisma.taxRate.findUnique.mockResolvedValue(mockTaxRate);

      const result = await service.findOne(mockTaxRate.id);

      expect(result).toEqual(mockTaxRate);
    });

    it('should throw NotFoundException when rate does not exist', async () => {
      prisma.taxRate.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should unset other defaults when setting isDefault to true', async () => {
      prisma.taxRate.findUnique.mockResolvedValue(mockTaxRate);
      prisma.taxRate.updateMany.mockResolvedValue({ count: 0 });
      prisma.taxRate.update.mockResolvedValue(mockTaxRate);

      await service.update(mockTaxRate.id, { isDefault: true } as never);

      expect(prisma.taxRate.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true, id: { not: mockTaxRate.id } },
        data: { isDefault: false },
      });
    });

    it('should skip unsetting defaults when isDefault is not true', async () => {
      prisma.taxRate.findUnique.mockResolvedValue(mockTaxRate);
      prisma.taxRate.update.mockResolvedValue({ ...mockTaxRate, name: 'Updated' });

      await service.update(mockTaxRate.id, { name: 'Updated' } as never);

      expect(prisma.taxRate.updateMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when rate does not exist', async () => {
      prisma.taxRate.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'x' } as never)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete tax rate', async () => {
      prisma.taxRate.findUnique.mockResolvedValue(mockTaxRate);
      prisma.taxRate.delete.mockResolvedValue({} as never);

      const result = await service.remove(mockTaxRate.id);

      expect(result).toEqual({ message: 'Tax rate deleted successfully' });
      expect(prisma.taxRate.delete).toHaveBeenCalledWith({ where: { id: mockTaxRate.id } });
    });

    it('should throw NotFoundException when rate does not exist', async () => {
      prisma.taxRate.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);

      expect(prisma.taxRate.delete).not.toHaveBeenCalled();
    });
  });
});
