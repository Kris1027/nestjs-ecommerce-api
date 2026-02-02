import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import type { AddToCartDto, UpdateCartItemDto } from './dto';

// What we return for each cart item - product info needed for display
const cartItemSelect = {
  id: true,
  quantity: true,
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      stock: true,
      reservedStock: true,
      isActive: true,
      images: {
        select: { url: true, alt: true },
        orderBy: { sortOrder: 'asc' as const },
        take: 1, // Only the primary image
      },
    },
  },
} as const;

// Derive TypeScript type from the select object
type CartItemPayload = Prisma.CartItemGetPayload<{ select: typeof cartItemSelect }>;

// Shape we return to the controller
type CartResponse = {
  id: string;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    product: {
      id: string;
      name: string;
      slug: string;
      imageUrl: string | null;
    };
  }[];
  totalItems: number;
  subtotal: number;
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // HELPER METHODS
  // ============================================

  // Transforms raw Prisma cart items into a clean response
  private formatCartResponse(cartId: string, items: CartItemPayload[]): CartResponse {
    let subtotal = 0;
    let totalItems = 0;

    const formattedItems = items.map((item) => {
      const unitPrice = Number(item.product.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      totalItems += item.quantity;

      return {
        id: item.id,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          imageUrl: item.product.images[0]?.url ?? null,
        },
      };
    });

    return {
      id: cartId,
      items: formattedItems,
      totalItems,
      subtotal: Math.round(subtotal * 100) / 100, // Avoid floating point drift
    };
  }

  // Gets or creates a cart for the user (lazy creation)
  private async getOrCreateCart(userId: string): Promise<{ id: string }> {
    const existing = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.cart.create({
      data: { userId },
      select: { id: true },
    });
  }

  // Validates the product can be added to cart
  private async validateProduct(productId: string, quantity: number): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true, stock: true, reservedStock: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    const availableStock = product.stock - product.reservedStock;
    if (quantity > availableStock) {
      throw new BadRequestException(`Insufficient stock. Available: ${availableStock}`);
    }
  }

  // ============================================
  // PUBLIC METHODS
  // ============================================

  async getCart(userId: string): Promise<CartResponse> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: {
        id: true,
        items: {
          select: cartItemSelect,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // No cart yet - return empty cart shape
    if (!cart) {
      return { id: '', items: [], totalItems: 0, subtotal: 0 };
    }

    return this.formatCartResponse(cart.id, cart.items);
  }

  async addItem(userId: string, dto: AddToCartDto): Promise<CartResponse> {
    // Validate the product first
    await this.validateProduct(dto.productId, dto.quantity);

    const cart = await this.getOrCreateCart(userId);

    // Check if product already in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: dto.productId,
        },
      },
      select: { id: true, quantity: true },
    });

    if (existingItem) {
      // Product already in cart - increment quantity
      const newQuantity = existingItem.quantity + dto.quantity;

      // Re-validate with the total quantity
      await this.validateProduct(dto.productId, newQuantity);

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // New product - create cart item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<CartResponse> {
    // Find the cart item and verify ownership
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        productId: true,
        cart: { select: { userId: true } },
      },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    // Validate stock for the new quantity
    await this.validateProduct(item.productId, dto.quantity);

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartResponse> {
    // Find the cart item and verify ownership
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        cart: { select: { userId: true } },
      },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<CartResponse> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      return { id: '', items: [], totalItems: 0, subtotal: 0 };
    }

    // Delete all items but keep the cart shell
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { id: cart.id, items: [], totalItems: 0, subtotal: 0 };
  }
}
