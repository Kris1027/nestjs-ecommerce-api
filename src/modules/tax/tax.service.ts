import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import type { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import type { UpdateTaxRateDto } from './dto/update-tax-rate.dto';

// Select fields for tax rate responses
const taxRateSelect = {
  id: true,
  name: true,
  rate: true,
  isDefault: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

type TaxRatePayload = Prisma.TaxRateGetPayload<{ select: typeof taxRateSelect }>;

@Injectable()
export class TaxService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // PUBLIC METHOD (used by OrdersService)
  // ============================================

  /**
   * Calculate tax for a given subtotal using the default active tax rate.
   * Returns { tax: number, rate: string } or { tax: 0, rate: null } if no default.
   */
  async calculateTax(subtotal: number): Promise<{ tax: number; rate: string | null }> {
    // Find the active default tax rate
    const defaultRate = await this.prisma.taxRate.findFirst({
      where: {
        isDefault: true,
        isActive: true,
      },
      select: { rate: true },
    });

    // No default rate configured - return 0 tax
    if (!defaultRate) {
      return { tax: 0, rate: null };
    }

    // Calculate tax: subtotal * rate (e.g., 100 * 0.23 = 23)
    const rateDecimal = Number(defaultRate.rate);
    const tax = Math.round(subtotal * rateDecimal * 100) / 100; // Round to 2 decimals

    return { tax, rate: defaultRate.rate.toString() };
  }

  // ============================================
  // ADMIN METHODS
  // ============================================

  async create(dto: CreateTaxRateDto): Promise<TaxRatePayload> {
    // Use transaction to prevent race condition with multiple defaults
    return this.prisma.$transaction(async (tx) => {
      // If this is set as default, unset any existing default first
      if (dto.isDefault) {
        await tx.taxRate.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.taxRate.create({
        data: {
          name: dto.name,
          rate: dto.rate,
          isDefault: dto.isDefault ?? false,
        },
        select: taxRateSelect,
      });
    });
  }

  async findAll(): Promise<TaxRatePayload[]> {
    return this.prisma.taxRate.findMany({
      select: taxRateSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<TaxRatePayload> {
    const taxRate = await this.prisma.taxRate.findUnique({
      where: { id },
      select: taxRateSelect,
    });

    if (!taxRate) {
      throw new NotFoundException('Tax rate not found');
    }

    return taxRate;
  }

  async update(id: string, dto: UpdateTaxRateDto): Promise<TaxRatePayload> {
    // Check if exists
    await this.findOne(id);

    // Use transaction to prevent race condition with multiple defaults
    return this.prisma.$transaction(async (tx) => {
      // If setting this as default, unset any existing default first
      if (dto.isDefault === true) {
        await tx.taxRate.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.taxRate.update({
        where: { id },
        data: {
          name: dto.name,
          rate: dto.rate,
          isDefault: dto.isDefault,
          isActive: dto.isActive,
        },
        select: taxRateSelect,
      });
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    // Check if exists
    await this.findOne(id);

    await this.prisma.taxRate.delete({ where: { id } });

    return { message: 'Tax rate deleted successfully' };
  }
}
