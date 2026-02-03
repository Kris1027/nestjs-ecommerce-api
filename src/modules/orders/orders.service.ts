import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, OrderStatus, StockMovementType } from '../../generated/prisma/client';
import {
  getPrismaPageArgs,
  paginate,
  type PaginatedResult,
} from '../../common/utils/pagination.util';
import { ensureUniqueOrderNumber } from '../../common/utils/order-number.util';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import type { OrderQuery } from './dto';

// ============================================
// SELECT OBJECTS & TYPES
// ============================================

// What we return for each order item
const orderItemSelect = {
  id: true,
  productId: true,
  productName: true,
  productSku: true,
  productImageUrl: true,
  quantity: true,
  unitPrice: true,
  lineTotal: true,
} as const;

// What we return for an order (list view - no items)
const orderListSelect = {
  id: true,
  orderNumber: true,
  status: true,
  subtotal: true,
  shippingCost: true,
  tax: true,
  total: true,
  createdAt: true,
  updatedAt: true,
} as const;

// What we return for a single order (detail view - with items and address)
const orderDetailSelect = {
  ...orderListSelect,
  userId: true,
  shippingFullName: true,
  shippingPhone: true,
  shippingStreet: true,
  shippingCity: true,
  shippingRegion: true,
  shippingPostalCode: true,
  shippingCountry: true,
  notes: true,
  adminNotes: true,
  items: { select: orderItemSelect },
} as const;

type OrderListPayload = Prisma.OrderGetPayload<{ select: typeof orderListSelect }>;
type OrderDetailPayload = Prisma.OrderGetPayload<{ select: typeof orderDetailSelect }>;

// ============================================
// VALID STATUS TRANSITIONS
// ============================================

// Defines which statuses an order can move TO from each status
const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CUSTOMER METHODS
  // ============================================

  async checkout(userId: string, dto: CreateOrderDto): Promise<OrderDetailPayload> {
    // 1. Fetch the user's cart with product details
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: {
        id: true,
        items: {
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                sku: true,
                stock: true,
                reservedStock: true,
                isActive: true,
                images: {
                  select: { url: true },
                  orderBy: { sortOrder: 'asc' as const },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 2. Validate all products are still active and in stock
    for (const item of cart.items) {
      if (!item.product.isActive) {
        throw new BadRequestException(`Product "${item.product.name}" is no longer available`);
      }

      const availableStock = item.product.stock - item.product.reservedStock;
      if (item.quantity > availableStock) {
        throw new BadRequestException(
          `Insufficient stock for "${item.product.name}". Available: ${availableStock}`,
        );
      }
    }

    // 3. Fetch and validate the shipping address (must belong to this user)
    const address = await this.prisma.address.findUnique({
      where: { id: dto.shippingAddressId },
    });

    if (!address || address.userId !== userId) {
      throw new NotFoundException('Shipping address not found');
    }

    // 4. Calculate totals from server-side prices (never trust client prices)
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    const tax = 0; // Will integrate tax calculation later
    const shippingCost = 0; // Will integrate shipping calculation later
    const total = subtotal + tax + shippingCost;

    // 5. Generate a unique order number (retry on collision)
    const orderNumber = await ensureUniqueOrderNumber((num) =>
      this.prisma.order.findUnique({ where: { orderNumber: num }, select: { id: true } }),
    );

    // 6. Create order, order items, reserve stock, and clear cart — all atomically
    const order = await this.prisma.$transaction(async (tx) => {
      // Create the order with address snapshot
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: OrderStatus.PENDING,
          shippingFullName: address.fullName,
          shippingPhone: address.phone,
          shippingStreet: address.street,
          shippingCity: address.city,
          shippingRegion: address.region,
          shippingPostalCode: address.postalCode,
          shippingCountry: address.country,
          subtotal,
          shippingCost,
          tax,
          total,
          notes: dto.notes,
          items: {
            create: cart.items.map((item) => ({
              productId: item.product.id,
              productName: item.product.name,
              productSku: item.product.sku,
              productImageUrl: item.product.images[0]?.url ?? null,
              quantity: item.quantity,
              unitPrice: item.product.price,
              lineTotal: Number(item.product.price) * item.quantity,
            })),
          },
        },
        select: orderDetailSelect,
      });

      // Reserve stock for each item inside the same transaction
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.product.id },
          data: { reservedStock: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.product.id,
            type: StockMovementType.RESERVATION,
            quantity: -item.quantity,
            reason: `Reserved for order ${orderNumber}`,
            stockBefore: item.product.stock,
            stockAfter: item.product.stock,
            userId,
          },
        });
      }

      // Clear the cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    return order;
  }

  async getMyOrders(userId: string, query: OrderQuery): Promise<PaginatedResult<OrderListPayload>> {
    const { skip, take } = getPrismaPageArgs(query);

    const where: Prisma.OrderWhereInput = { userId };

    // Apply optional status filter
    if (query.status) {
      where.status = query.status as OrderStatus;
    }

    // Apply optional date range filters
    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) {
        where.createdAt.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.createdAt.lte = new Date(query.toDate);
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: orderListSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(orders, total, query);
  }

  async getOrderById(orderId: string, userId?: string): Promise<OrderDetailPayload> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: orderDetailSelect,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // If userId is provided, verify ownership (customer access)
    if (userId && order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async cancelOrder(orderId: string, userId: string): Promise<OrderDetailPayload> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        orderNumber: true,
        items: { select: { productId: true, quantity: true } },
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    // Only PENDING and CONFIRMED orders can be cancelled by customers
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException(
        `Cannot cancel order with status "${order.status}". Only PENDING or CONFIRMED orders can be cancelled`,
      );
    }

    // Cancel order and release reserved stock atomically
    const updated = await this.prisma.$transaction(async (tx) => {
      const cancelled = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
        select: orderDetailSelect,
      });

      // Release reserved stock for each item
      for (const item of order.items) {
        if (!item.productId) {
          continue;
        } // Product was deleted

        await tx.product.update({
          where: { id: item.productId },
          data: { reservedStock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: StockMovementType.RELEASE,
            quantity: item.quantity,
            reason: `Released from cancelled order ${order.orderNumber}`,
            stockBefore: 0, // Simplified — exact value not critical for releases
            stockAfter: 0,
            userId,
          },
        });
      }

      return cancelled;
    });

    return updated;
  }

  // ============================================
  // ADMIN METHODS
  // ============================================

  async getAllOrders(query: OrderQuery): Promise<PaginatedResult<OrderListPayload>> {
    const { skip, take } = getPrismaPageArgs(query);

    const where: Prisma.OrderWhereInput = {};

    if (query.status) {
      where.status = query.status as OrderStatus;
    }

    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) {
        where.createdAt.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.createdAt.lte = new Date(query.toDate);
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: orderListSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(orders, total, query);
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto): Promise<OrderDetailPayload> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        orderNumber: true,
        items: { select: { productId: true, quantity: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate the status transition
    const newStatus = dto.status as OrderStatus;
    const allowed = validTransitions[order.status];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from "${order.status}" to "${newStatus}". Allowed: ${allowed.join(', ') || 'none (terminal state)'}`,
      );
    }

    // Update status + stock operations atomically in one transaction
    return this.prisma.$transaction(async (tx) => {
      // If confirming the order, convert reservations to actual sales
      if (newStatus === OrderStatus.CONFIRMED) {
        for (const item of order.items) {
          if (!item.productId) {
            continue;
          }

          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true, reservedStock: true },
          });

          if (!product || item.quantity > product.reservedStock) {
            throw new BadRequestException(
              `Cannot confirm sale: insufficient reserved stock for product ${item.productId}`,
            );
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: StockMovementType.SALE,
              quantity: -item.quantity,
              reason: `Order ${order.orderNumber} confirmed`,
              stockBefore: product.stock,
              stockAfter: product.stock - item.quantity,
            },
          });
        }
      }

      // If admin cancels, release reserved stock (only if not yet confirmed)
      if (newStatus === OrderStatus.CANCELLED && order.status === OrderStatus.PENDING) {
        for (const item of order.items) {
          if (!item.productId) {
            continue;
          }

          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true, reservedStock: true },
          });

          if (product) {
            await tx.product.update({
              where: { id: item.productId },
              data: { reservedStock: { decrement: item.quantity } },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: StockMovementType.RELEASE,
                quantity: item.quantity,
                reason: `Released from cancelled order ${order.orderNumber}`,
                stockBefore: product.stock,
                stockAfter: product.stock,
              },
            });
          }
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          adminNotes: dto.adminNotes,
        },
        select: orderDetailSelect,
      });
    });
  }
}
