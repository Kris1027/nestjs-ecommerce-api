import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, CouponType } from '../../generated/prisma/client';
import {
  getPrismaPageArgs,
  paginate,
  type PaginatedResult,
} from '../../common/utils/pagination.util';
import type { CreateCouponDto } from './dto/create-coupon.dto';
import type { UpdateCouponDto } from './dto/update-coupon.dto';
import type { CouponQuery } from './dto';

// ============================================
// SELECT OBJECT & TYPE
// ============================================

// What we return for each coupon (all fields admins need to see)
const couponSelect = {
  id: true,
  code: true,
  description: true,
  type: true,
  value: true,
  minimumOrderAmount: true,
  maximumDiscount: true,
  usageLimit: true,
  usageLimitPerUser: true,
  usageCount: true,
  validFrom: true,
  validUntil: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

type CouponResponse = Prisma.CouponGetPayload<{ select: typeof couponSelect }>;

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // ADMIN METHODS
  // ============================================

  async create(dto: CreateCouponDto): Promise<CouponResponse> {
    // Check for duplicate code
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(`Coupon code "${dto.code}" already exists`);
    }

    return this.prisma.coupon.create({
      data: {
        code: dto.code,
        description: dto.description,
        type: dto.type,
        value: dto.value,
        minimumOrderAmount: dto.minimumOrderAmount,
        maximumDiscount: dto.maximumDiscount,
        usageLimit: dto.usageLimit,
        usageLimitPerUser: dto.usageLimitPerUser,
        validFrom: dto.validFrom,
        validUntil: dto.validUntil,
        isActive: dto.isActive,
      },
      select: couponSelect,
    });
  }

  async findAll(query: CouponQuery): Promise<PaginatedResult<CouponResponse>> {
    const { skip, take } = getPrismaPageArgs(query);

    const where: Prisma.CouponWhereInput = {};

    // Apply optional filters
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.type) {
      where.type = query.type as CouponType;
    }

    // Filter coupons whose validity window includes right now
    if (query.validNow) {
      const now = new Date();
      where.validFrom = { lte: now };
      where.validUntil = { gte: now };
    }

    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        select: couponSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return paginate(coupons, total, query);
  }

  async findById(id: string): Promise<CouponResponse> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      select: couponSelect,
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto): Promise<CouponResponse> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // If changing the code, check the new code isn't already taken
    if (dto.code) {
      const existing = await this.prisma.coupon.findUnique({
        where: { code: dto.code },
        select: { id: true },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException(`Coupon code "${dto.code}" already exists`);
      }
    }

    return this.prisma.coupon.update({
      where: { id },
      data: dto,
      select: couponSelect,
    });
  }

  async deactivate(id: string): Promise<{ message: string }> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is already deactivated');
    }

    await this.prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Coupon deactivated successfully' };
  }

  async hardDelete(id: string): Promise<{ message: string }> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.prisma.coupon.delete({ where: { id } });

    return { message: 'Coupon permanently deleted' };
  }

  // ============================================
  // VALIDATION (used by checkout)
  // ============================================

  async validateCoupon(
    code: string,
    userId: string,
    subtotal: number,
  ): Promise<{ couponId: string; discountAmount: number }> {
    // 1. Find the coupon by code
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // 2. Check if active
    if (!coupon.isActive) {
      throw new BadRequestException('This coupon is no longer active');
    }

    // 3. Check validity window
    const now = new Date();
    if (now < coupon.validFrom) {
      throw new BadRequestException('This coupon is not yet valid');
    }
    if (now > coupon.validUntil) {
      throw new BadRequestException('This coupon has expired');
    }

    // 4. Check global usage limit
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has reached its usage limit');
    }

    // 5. Check per-user usage limit
    if (coupon.usageLimitPerUser !== null) {
      const userUsageCount = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });

      if (userUsageCount >= coupon.usageLimitPerUser) {
        throw new BadRequestException(
          'You have already used this coupon the maximum number of times',
        );
      }
    }

    // 6. Check minimum order amount
    if (coupon.minimumOrderAmount !== null && subtotal < Number(coupon.minimumOrderAmount)) {
      throw new BadRequestException(
        `Minimum order amount of ${Number(coupon.minimumOrderAmount)} required to use this coupon`,
      );
    }

    // 7. Calculate discount amount
    let discountAmount: number;

    if (coupon.type === CouponType.PERCENTAGE) {
      // Percentage: 10% of $200 = $20
      discountAmount = subtotal * (Number(coupon.value) / 100);

      // Apply maximum discount cap if set
      if (coupon.maximumDiscount !== null && discountAmount > Number(coupon.maximumDiscount)) {
        discountAmount = Number(coupon.maximumDiscount);
      }
    } else {
      // Fixed amount: straight dollar discount
      discountAmount = Number(coupon.value);
    }

    // Discount cannot exceed the subtotal (no negative totals)
    discountAmount = Math.min(discountAmount, subtotal);

    // Round to 2 decimal places to match Decimal(10,2)
    discountAmount = Math.round(discountAmount * 100) / 100;

    return { couponId: coupon.id, discountAmount };
  }
}
