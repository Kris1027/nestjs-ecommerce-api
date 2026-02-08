import { Test, type TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { createMockPrismaClient, resetMockPrismaClient } from '@test/mocks/prisma.mock';
import { createMockEventEmitter } from '@test/mocks/common.mock';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvents } from '../notifications/events';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: ReturnType<typeof createMockPrismaClient>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(async () => {
    prisma = createMockPrismaClient();
    eventEmitter = createMockEventEmitter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    resetMockPrismaClient(prisma);
  });

  const mockStockProduct = {
    id: 'clprod123456789012345678',
    name: 'Test Product',
    sku: 'TP-001',
    stock: 100,
    reservedStock: 10,
    lowStockThreshold: 5,
  };

  const mockMovement = {
    id: 'clmov1234567890123456789',
    productId: 'clprod123456789012345678',
    type: 'ADJUSTMENT',
    quantity: 10,
    reason: 'Restocking',
    stockBefore: 100,
    stockAfter: 110,
    userId: 'cluser123456789012345678',
    createdAt: new Date('2025-01-01'),
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStock', () => {
    it('should return stock info with computed fields', async () => {
      prisma.product.findUnique.mockResolvedValue(mockStockProduct);

      const result = await service.getStock('clprod123456789012345678');

      expect(result).toEqual({
        ...mockStockProduct,
        availableStock: 90,
        isLowStock: false,
      });
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'clprod123456789012345678' },
        select: expect.objectContaining({ id: true, stock: true, reservedStock: true }),
      });
    });

    it('should flag isLowStock when available stock is at or below threshold', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...mockStockProduct,
        stock: 10,
        reservedStock: 6,
      });

      const result = await service.getStock('clprod123456789012345678');

      expect(result.availableStock).toBe(4);
      expect(result.isLowStock).toBe(true);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.getStock('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMovementHistory', () => {
    it('should return paginated movement history', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: mockStockProduct.id });
      prisma.stockMovement.findMany.mockResolvedValue([mockMovement]);
      prisma.stockMovement.count.mockResolvedValue(1);

      const result = await service.getMovementHistory(mockStockProduct.id, {
        page: 1,
        limit: 10,
        sortOrder: 'desc',
      });

      expect(result.data).toEqual([mockMovement]);
      expect(result.meta).toEqual(expect.objectContaining({ total: 1, page: 1, limit: 10 }));
      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: mockStockProduct.id },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should paginate with correct offset for page 2', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: mockStockProduct.id });
      prisma.stockMovement.findMany.mockResolvedValue([]);
      prisma.stockMovement.count.mockResolvedValue(15);

      await service.getMovementHistory(mockStockProduct.id, {
        page: 2,
        limit: 10,
        sortOrder: 'desc',
      });

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('should throw NotFoundException when product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.getMovementHistory('nonexistent', { page: 1, limit: 10, sortOrder: 'desc' }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.stockMovement.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getLowStockProducts', () => {
    it('should return only products with low stock', async () => {
      const products = [
        { ...mockStockProduct, stock: 100, reservedStock: 10, lowStockThreshold: 5 },
        { ...mockStockProduct, id: 'low-1', stock: 8, reservedStock: 5, lowStockThreshold: 5 },
        { ...mockStockProduct, id: 'low-2', stock: 5, reservedStock: 5, lowStockThreshold: 5 },
      ];
      prisma.product.findMany.mockResolvedValue(products);

      const result = await service.getLowStockProducts({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.data[0]).toEqual(
        expect.objectContaining({ id: 'low-1', availableStock: 3, isLowStock: true }),
      );
      expect(result.data[1]).toEqual(
        expect.objectContaining({ id: 'low-2', availableStock: 0, isLowStock: true }),
      );
    });

    it('should return empty results when no products are low stock', async () => {
      prisma.product.findMany.mockResolvedValue([
        { ...mockStockProduct, stock: 100, reservedStock: 0, lowStockThreshold: 5 },
      ]);

      const result = await service.getLowStockProducts({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should only query active products', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await service.getLowStockProducts({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });

    it('should paginate filtered results correctly', async () => {
      const lowStockProducts = [
        { ...mockStockProduct, id: 'low-1', stock: 3, reservedStock: 0, lowStockThreshold: 5 },
        { ...mockStockProduct, id: 'low-2', stock: 4, reservedStock: 0, lowStockThreshold: 5 },
        { ...mockStockProduct, id: 'low-3', stock: 2, reservedStock: 0, lowStockThreshold: 5 },
      ];
      prisma.product.findMany.mockResolvedValue(lowStockProducts);

      const result = await service.getLowStockProducts({ page: 2, limit: 2, sortOrder: 'desc' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(expect.objectContaining({ id: 'low-3' }));
      expect(result.meta.total).toBe(3);
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock and create movement record', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: mockStockProduct.id,
        stock: 100,
      });
      prisma.product.update.mockResolvedValue({
        ...mockStockProduct,
        stock: 110,
      });
      prisma.stockMovement.create.mockResolvedValue(mockMovement);

      const result = await service.adjustStock(
        mockStockProduct.id,
        10,
        'ADJUSTMENT' as never,
        'cluser123456789012345678',
        'Restocking',
      );

      expect(result.product).toEqual(
        expect.objectContaining({
          stock: 110,
          availableStock: 100,
          isLowStock: false,
        }),
      );
      expect(result.movement).toEqual(mockMovement);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: mockStockProduct.id },
        data: { stock: 110 },
        select: expect.objectContaining({ id: true, stock: true }),
      });

      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: mockStockProduct.id,
          type: 'ADJUSTMENT',
          quantity: 10,
          reason: 'Restocking',
          stockBefore: 100,
          stockAfter: 110,
          userId: 'cluser123456789012345678',
        }),
        select: expect.objectContaining({ id: true }),
      });

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should emit LowStockEvent when stock drops below threshold', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: mockStockProduct.id,
        stock: 10,
      });
      prisma.product.update.mockResolvedValue({
        ...mockStockProduct,
        stock: 3,
        reservedStock: 0,
        lowStockThreshold: 5,
      });
      prisma.stockMovement.create.mockResolvedValue(mockMovement);

      await service.adjustStock(mockStockProduct.id, -7, 'ADJUSTMENT' as never);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        NotificationEvents.LOW_STOCK,
        expect.objectContaining({
          productId: mockStockProduct.id,
          productName: 'Test Product',
          currentStock: 3,
          threshold: 5,
        }),
      );
    });

    it('should throw BadRequestException when adjustment would make stock negative', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: mockStockProduct.id,
        stock: 5,
      });

      await expect(
        service.adjustStock(mockStockProduct.id, -10, 'ADJUSTMENT' as never),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.adjustStock('nonexistent', 10, 'ADJUSTMENT' as never)).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.product.update).not.toHaveBeenCalled();
      expect(prisma.stockMovement.create).not.toHaveBeenCalled();
    });
  });

  describe('reserveStock', () => {
    it('should reserve stock and create movement record', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: mockStockProduct.id,
        stock: 100,
        reservedStock: 10,
      });
      prisma.product.update.mockResolvedValue({
        ...mockStockProduct,
        stock: 100,
        reservedStock: 15,
      });
      prisma.stockMovement.create.mockResolvedValue(mockMovement);

      const result = await service.reserveStock(mockStockProduct.id, 5, 'cluser123456789012345678');

      expect(result.product).toEqual(
        expect.objectContaining({
          reservedStock: 15,
          availableStock: 85,
        }),
      );
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { reservedStock: { increment: 5 } },
        }),
      );
      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'RESERVATION',
          quantity: -5,
          reason: 'Stock reserved for cart',
        }),
        select: expect.objectContaining({ id: true }),
      });
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: mockStockProduct.id,
        stock: 100,
        reservedStock: 95,
      });

      await expect(service.reserveStock(mockStockProduct.id, 10)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when quantity is zero or negative', async () => {
      await expect(service.reserveStock(mockStockProduct.id, 0)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.reserveStock(mockStockProduct.id, -5)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.product.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.reserveStock('nonexistent', 5)).rejects.toThrow(NotFoundException);
    });
  });

  describe('releaseStock', () => {
    it('should release reserved stock and create movement record', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: mockStockProduct.id,
        stock: 100,
        reservedStock: 10,
      });
      prisma.product.update.mockResolvedValue({
        ...mockStockProduct,
        stock: 100,
        reservedStock: 5,
      });
      prisma.stockMovement.create.mockResolvedValue(mockMovement);

      const result = await service.releaseStock(mockStockProduct.id, 5, 'cluser123456789012345678');

      expect(result.product).toEqual(
        expect.objectContaining({
          reservedStock: 5,
          availableStock: 95,
        }),
      );
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { reservedStock: { decrement: 5 } },
        }),
      );
      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'RELEASE',
          quantity: 5,
          reason: 'Stock released from cart',
        }),
        select: expect.objectContaining({ id: true }),
      });
    });

    it('should throw BadRequestException when releasing more than reserved', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: mockStockProduct.id,
        stock: 100,
        reservedStock: 3,
      });

      await expect(service.releaseStock(mockStockProduct.id, 10)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when quantity is zero or negative', async () => {
      await expect(service.releaseStock(mockStockProduct.id, 0)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.product.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.releaseStock('nonexistent', 5)).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmSale', () => {
    it('should decrement both stock and reservedStock', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: mockStockProduct.id,
        stock: 100,
        reservedStock: 10,
      });
      prisma.product.update.mockResolvedValue({
        ...mockStockProduct,
        stock: 95,
        reservedStock: 5,
      });
      prisma.stockMovement.create.mockResolvedValue(mockMovement);

      const result = await service.confirmSale(mockStockProduct.id, 5, 'cluser123456789012345678');

      expect(result.product).toEqual(
        expect.objectContaining({
          stock: 95,
          reservedStock: 5,
          availableStock: 90,
        }),
      );
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            stock: { decrement: 5 },
            reservedStock: { decrement: 5 },
          },
        }),
      );
      expect(prisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'SALE',
          quantity: -5,
          reason: 'Order confirmed',
          stockBefore: 100,
          stockAfter: 95,
        }),
        select: expect.objectContaining({ id: true }),
      });
    });

    it('should throw BadRequestException when confirming more than reserved', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: mockStockProduct.id,
        stock: 100,
        reservedStock: 3,
      });

      await expect(service.confirmSale(mockStockProduct.id, 10)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when quantity is zero or negative', async () => {
      await expect(service.confirmSale(mockStockProduct.id, 0)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.product.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.confirmSale('nonexistent', 5)).rejects.toThrow(NotFoundException);
    });
  });
});
