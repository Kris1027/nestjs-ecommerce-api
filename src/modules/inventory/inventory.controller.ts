import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { AdjustStockDto } from './dto';
import { StockMovementType } from '../../generated/prisma/client';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Get('low-stock')
  @Roles('ADMIN')
  getLowStockProducts(): ReturnType<InventoryService['getLowStockProducts']> {
    return this.inventoryService.getLowStockProducts();
  }

  @Get(':productId')
  @Roles('ADMIN')
  getStock(@Param('productId') productId: string): ReturnType<InventoryService['getStock']> {
    return this.inventoryService.getStock(productId);
  }

  @Get(':productId/history')
  @Roles('ADMIN')
  getMovementHistory(
    @Param('productId') productId: string,
    @Query('limit') limit?: string,
  ): ReturnType<InventoryService['getMovementHistory']> {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.inventoryService.getMovementHistory(productId, parsedLimit);
  }

  @Post(':productId/adjust')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  adjustStock(
    @Param('productId') productId: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser('sub') userId: string,
  ): ReturnType<InventoryService['adjustStock']> {
    return this.inventoryService.adjustStock(
      productId,
      dto.quantity,
      StockMovementType[dto.type],
      userId,
      dto.reason,
    );
  }
}
