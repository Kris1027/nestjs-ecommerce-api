import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators';
import {
  ApiErrorResponses,
  ApiSuccessListResponse,
  ApiSuccessResponse,
} from '../../common/swagger';
import { MessageResponseDto } from '../users/dto';
import { CreateTaxRateDto, TaxRateResponseDto, UpdateTaxRateDto } from './dto';
import { TaxService } from './tax.service';

@ApiTags('Tax')
@ApiBearerAuth('access-token')
@Roles('ADMIN')
@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Post('rates')
  @ApiOperation({ summary: 'Create a new tax rate (admin)' })
  @ApiSuccessResponse(TaxRateResponseDto, 201, 'Tax rate created')
  @ApiErrorResponses(400, 401, 403, 429)
  create(@Body() dto: CreateTaxRateDto): ReturnType<TaxService['create']> {
    return this.taxService.create(dto);
  }

  @Get('rates')
  @ApiOperation({ summary: 'List all tax rates (admin)' })
  @ApiSuccessListResponse(TaxRateResponseDto, 'List of tax rates')
  @ApiErrorResponses(401, 403, 429)
  findAll(): ReturnType<TaxService['findAll']> {
    return this.taxService.findAll();
  }

  @Get('rates/:id')
  @ApiOperation({ summary: 'Get a tax rate by ID (admin)' })
  @ApiParam({ name: 'id', description: 'Tax rate CUID' })
  @ApiSuccessResponse(TaxRateResponseDto, 200, 'Tax rate retrieved')
  @ApiErrorResponses(401, 403, 404, 429)
  findOne(@Param('id') id: string): ReturnType<TaxService['findOne']> {
    return this.taxService.findOne(id);
  }

  @Patch('rates/:id')
  @ApiOperation({ summary: 'Update a tax rate (admin)' })
  @ApiParam({ name: 'id', description: 'Tax rate CUID' })
  @ApiSuccessResponse(TaxRateResponseDto, 200, 'Tax rate updated')
  @ApiErrorResponses(400, 401, 403, 404, 429)
  update(@Param('id') id: string, @Body() dto: UpdateTaxRateDto): ReturnType<TaxService['update']> {
    return this.taxService.update(id, dto);
  }

  @Delete('rates/:id')
  @ApiOperation({ summary: 'Delete a tax rate (admin)' })
  @ApiParam({ name: 'id', description: 'Tax rate CUID' })
  @ApiSuccessResponse(MessageResponseDto, 200, 'Tax rate deleted')
  @ApiErrorResponses(401, 403, 404, 429)
  remove(@Param('id') id: string): ReturnType<TaxService['remove']> {
    return this.taxService.remove(id);
  }
}
