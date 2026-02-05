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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { Public, Roles } from '../../common/decorators';
import { CreateShippingMethodDto, ShippingMethodDto, UpdateShippingMethodDto } from './dto';
import { MessageResponseDto } from '../users/dto';
import {
  ApiErrorResponses,
  ApiSuccessListResponse,
  ApiSuccessResponse,
} from '../../common/swagger';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  // List active shipping methods (customers see this at checkout)
  @Get('methods')
  @Public()
  @ApiOperation({ summary: 'List active shipping methods for checkout' })
  @ApiSuccessListResponse(ShippingMethodDto, 'Active shipping methods')
  @ApiErrorResponses(429)
  findActive(): ReturnType<ShippingService['findActive']> {
    return this.shippingService.findActive();
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Post('methods')
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a shipping method (admin)' })
  @ApiSuccessResponse(ShippingMethodDto, 201, 'Shipping method created')
  @ApiErrorResponses(400, 401, 403, 429)
  create(@Body() dto: CreateShippingMethodDto): ReturnType<ShippingService['create']> {
    return this.shippingService.create(dto);
  }

  @Get('methods/all')
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all shipping methods including inactive (admin)' })
  @ApiSuccessListResponse(ShippingMethodDto, 'All shipping methods')
  @ApiErrorResponses(401, 403, 429)
  findAll(): ReturnType<ShippingService['findAll']> {
    return this.shippingService.findAll();
  }

  @Get('methods/:id')
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get shipping method details by ID (admin)' })
  @ApiParam({ name: 'id', description: 'Shipping method CUID' })
  @ApiSuccessResponse(ShippingMethodDto, 200, 'Shipping method details')
  @ApiErrorResponses(401, 403, 404, 429)
  findById(@Param('id') id: string): ReturnType<ShippingService['findById']> {
    return this.shippingService.findById(id);
  }

  @Patch('methods/:id')
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update shipping method details (admin)' })
  @ApiParam({ name: 'id', description: 'Shipping method CUID' })
  @ApiSuccessResponse(ShippingMethodDto, 200, 'Shipping method updated')
  @ApiErrorResponses(400, 401, 403, 404, 429)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShippingMethodDto,
  ): ReturnType<ShippingService['update']> {
    return this.shippingService.update(id, dto);
  }

  @Post('methods/:id/deactivate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Deactivate a shipping method (admin)' })
  @ApiParam({ name: 'id', description: 'Shipping method CUID' })
  @ApiSuccessResponse(MessageResponseDto, 200, 'Shipping method deactivated')
  @ApiErrorResponses(400, 401, 403, 404, 429)
  deactivate(@Param('id') id: string): ReturnType<ShippingService['deactivate']> {
    return this.shippingService.deactivate(id);
  }

  @Delete('methods/:id')
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Permanently delete a shipping method (admin)' })
  @ApiParam({ name: 'id', description: 'Shipping method CUID' })
  @ApiSuccessResponse(MessageResponseDto, 200, 'Shipping method deleted')
  @ApiErrorResponses(401, 403, 404, 429)
  hardDelete(@Param('id') id: string): ReturnType<ShippingService['hardDelete']> {
    return this.shippingService.hardDelete(id);
  }
}
