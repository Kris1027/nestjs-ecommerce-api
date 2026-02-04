import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { Roles, CurrentUser } from '../../common/decorators';
import { CreateCouponDto, UpdateCouponDto, CouponQueryDto } from './dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // ============================================
  // CUSTOMER ENDPOINTS
  // ============================================

  // Validate a coupon code before checkout (returns discount preview)
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validateCoupon(
    @Body('code') code: string,
    @Body('subtotal') subtotal: string,
    @CurrentUser('sub') userId: string,
  ): ReturnType<CouponsService['validateCoupon']> {
    return this.couponsService.validateCoupon(code, userId, parseFloat(subtotal));
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateCouponDto): ReturnType<CouponsService['create']> {
    return this.couponsService.create(dto);
  }

  @Get()
  @Roles('ADMIN')
  findAll(@Query() query: CouponQueryDto): ReturnType<CouponsService['findAll']> {
    return this.couponsService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN')
  findById(@Param('id') id: string): ReturnType<CouponsService['findById']> {
    return this.couponsService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
  ): ReturnType<CouponsService['update']> {
    return this.couponsService.update(id, dto);
  }

  @Post(':id/deactivate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('id') id: string): ReturnType<CouponsService['deactivate']> {
    return this.couponsService.deactivate(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  hardDelete(@Param('id') id: string): ReturnType<CouponsService['hardDelete']> {
    return this.couponsService.hardDelete(id);
  }
}
