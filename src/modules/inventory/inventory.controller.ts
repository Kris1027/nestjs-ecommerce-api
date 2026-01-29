import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { AdjustStockDto } from './dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { StockMovementType } from '../../generated/prisma/client';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Get('low-stock')
  @Roles('ADMIN')
  getLowStockProducts(
    @Query() query: PaginationQueryDto,
  ): ReturnType<InventoryService['getLowStockProducts']> {
    return this.inventoryService.getLowStockProducts(query);
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
    @Query() query: PaginationQueryDto,
  ): ReturnType<InventoryService['getMovementHistory']> {
    return this.inventoryService.getMovementHistory(productId, query);
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
