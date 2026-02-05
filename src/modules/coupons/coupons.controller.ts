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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { Roles, CurrentUser } from '../../common/decorators';
import {
  CouponDto,
  CouponQueryDto,
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponResponseDto,
} from './dto';
import { MessageResponseDto } from '../users/dto';
import { ApiErrorResponses, ApiPaginatedResponse, ApiSuccessResponse } from '../../common/swagger';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // ============================================
  // CUSTOMER ENDPOINTS
  // ============================================

  // Validate a coupon code before checkout (returns discount preview)
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Validate a coupon code and preview discount' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['code', 'subtotal'],
      properties: {
        code: { type: 'string', example: 'SUMMER20', description: 'Coupon code to validate' },
        subtotal: {
          type: 'string',
          example: '150.00',
          description: 'Current cart subtotal for discount calculation',
        },
      },
    },
  })
  @ApiSuccessResponse(ValidateCouponResponseDto, 200, 'Coupon is valid')
  @ApiErrorResponses(400, 401, 404, 429)
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
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new coupon (admin)' })
  @ApiSuccessResponse(CouponDto, 201, 'Coupon created')
  @ApiErrorResponses(400, 401, 403, 429)
  create(@Body() dto: CreateCouponDto): ReturnType<CouponsService['create']> {
    return this.couponsService.create(dto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all coupons with filters (admin)' })
  @ApiPaginatedResponse(CouponDto, 'Paginated coupon list')
  @ApiErrorResponses(401, 403, 429)
  findAll(@Query() query: CouponQueryDto): ReturnType<CouponsService['findAll']> {
    return this.couponsService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get coupon details by ID (admin)' })
  @ApiParam({ name: 'id', description: 'Coupon CUID' })
  @ApiSuccessResponse(CouponDto, 200, 'Coupon details')
  @ApiErrorResponses(401, 403, 404, 429)
  findById(@Param('id') id: string): ReturnType<CouponsService['findById']> {
    return this.couponsService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update coupon details (admin)' })
  @ApiParam({ name: 'id', description: 'Coupon CUID' })
  @ApiSuccessResponse(CouponDto, 200, 'Coupon updated')
  @ApiErrorResponses(400, 401, 403, 404, 429)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
  ): ReturnType<CouponsService['update']> {
    return this.couponsService.update(id, dto);
  }

  @Post(':id/deactivate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Deactivate a coupon (admin)' })
  @ApiParam({ name: 'id', description: 'Coupon CUID' })
  @ApiSuccessResponse(MessageResponseDto, 200, 'Coupon deactivated')
  @ApiErrorResponses(400, 401, 403, 404, 429)
  deactivate(@Param('id') id: string): ReturnType<CouponsService['deactivate']> {
    return this.couponsService.deactivate(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Permanently delete a coupon (admin)' })
  @ApiParam({ name: 'id', description: 'Coupon CUID' })
  @ApiSuccessResponse(MessageResponseDto, 200, 'Coupon deleted')
  @ApiErrorResponses(401, 403, 404, 429)
  hardDelete(@Param('id') id: string): ReturnType<CouponsService['hardDelete']> {
    return this.couponsService.hardDelete(id);
  }
}
