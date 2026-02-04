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
import { ShippingService } from './shipping.service';
import { Public, Roles } from '../../common/decorators';
import { CreateShippingMethodDto, UpdateShippingMethodDto } from './dto';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  // List active shipping methods (customers see this at checkout)
  @Get('methods')
  @Public()
  findActive(): ReturnType<ShippingService['findActive']> {
    return this.shippingService.findActive();
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Post('methods')
  @Roles('ADMIN')
  create(@Body() dto: CreateShippingMethodDto): ReturnType<ShippingService['create']> {
    return this.shippingService.create(dto);
  }

  @Get('methods/all')
  @Roles('ADMIN')
  findAll(): ReturnType<ShippingService['findAll']> {
    return this.shippingService.findAll();
  }

  @Get('methods/:id')
  @Roles('ADMIN')
  findById(@Param('id') id: string): ReturnType<ShippingService['findById']> {
    return this.shippingService.findById(id);
  }

  @Patch('methods/:id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShippingMethodDto,
  ): ReturnType<ShippingService['update']> {
    return this.shippingService.update(id, dto);
  }

  @Post('methods/:id/deactivate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('id') id: string): ReturnType<ShippingService['deactivate']> {
    return this.shippingService.deactivate(id);
  }

  @Delete('methods/:id')
  @Roles('ADMIN')
  hardDelete(@Param('id') id: string): ReturnType<ShippingService['hardDelete']> {
    return this.shippingService.hardDelete(id);
  }
}
