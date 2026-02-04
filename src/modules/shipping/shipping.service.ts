import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import type { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import type { UpdateShippingMethodDto } from './dto/update-shipping-method.dto';

// ============================================
// SELECT OBJECT & TYPE
// ============================================

// What we return for each shipping method
const shippingMethodSelect = {
  id: true,
  name: true,
  description: true,
  basePrice: true,
  freeShippingThreshold: true,
  estimatedDays: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

type ShippingMethodResponse = Prisma.ShippingMethodGetPayload<{
  select: typeof shippingMethodSelect;
}>;

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /** List all active shipping methods (shown to customers at checkout) */
  async findActive(): Promise<ShippingMethodResponse[]> {
    return this.prisma.shippingMethod.findMany({
      where: { isActive: true },
      select: shippingMethodSelect,
      orderBy: { sortOrder: 'asc' },
    });
  }

  /** Calculate shipping cost for a given method and order subtotal */
  async calculateShipping(
    shippingMethodId: string,
    subtotal: number,
  ): Promise<{ shippingCost: number; methodName: string }> {
    const method = await this.prisma.shippingMethod.findUnique({
      where: { id: shippingMethodId },
      select: { name: true, basePrice: true, freeShippingThreshold: true, isActive: true },
    });

    if (!method || !method.isActive) {
      throw new NotFoundException('Shipping method not found');
    }

    // Free shipping if subtotal meets the threshold
    const meetsThreshold =
      method.freeShippingThreshold !== null && subtotal >= Number(method.freeShippingThreshold);

    const shippingCost = meetsThreshold ? 0 : Number(method.basePrice);

    return { shippingCost, methodName: method.name };
  }

  // ============================================
  // ADMIN METHODS
  // ============================================

  async create(dto: CreateShippingMethodDto): Promise<ShippingMethodResponse> {
    // Check for duplicate name (unique constraint would throw, but a friendly error is better)
    const existing = await this.prisma.shippingMethod.findUnique({
      where: { name: dto.name },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(`Shipping method "${dto.name}" already exists`);
    }

    return this.prisma.shippingMethod.create({
      data: {
        name: dto.name,
        description: dto.description,
        basePrice: dto.basePrice,
        freeShippingThreshold: dto.freeShippingThreshold,
        estimatedDays: dto.estimatedDays,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
      select: shippingMethodSelect,
    });
  }

  async findAll(): Promise<ShippingMethodResponse[]> {
    return this.prisma.shippingMethod.findMany({
      select: shippingMethodSelect,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string): Promise<ShippingMethodResponse> {
    const method = await this.prisma.shippingMethod.findUnique({
      where: { id },
      select: shippingMethodSelect,
    });

    if (!method) {
      throw new NotFoundException('Shipping method not found');
    }

    return method;
  }

  async update(id: string, dto: UpdateShippingMethodDto): Promise<ShippingMethodResponse> {
    const method = await this.prisma.shippingMethod.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!method) {
      throw new NotFoundException('Shipping method not found');
    }

    // If renaming, check the new name isn't already taken
    if (dto.name) {
      const existing = await this.prisma.shippingMethod.findUnique({
        where: { name: dto.name },
        select: { id: true },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException(`Shipping method "${dto.name}" already exists`);
      }
    }

    return this.prisma.shippingMethod.update({
      where: { id },
      data: dto,
      select: shippingMethodSelect,
    });
  }

  async deactivate(id: string): Promise<{ message: string }> {
    const method = await this.prisma.shippingMethod.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!method) {
      throw new NotFoundException('Shipping method not found');
    }

    if (!method.isActive) {
      throw new BadRequestException('Shipping method is already deactivated');
    }

    await this.prisma.shippingMethod.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Shipping method deactivated successfully' };
  }

  async hardDelete(id: string): Promise<{ message: string }> {
    const method = await this.prisma.shippingMethod.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!method) {
      throw new NotFoundException('Shipping method not found');
    }

    await this.prisma.shippingMethod.delete({ where: { id } });

    return { message: 'Shipping method permanently deleted' };
  }
}
