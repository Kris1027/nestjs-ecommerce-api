import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ProductsService } from './products.service';
import { Public, Roles } from '../../common/decorators';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, UploadImageDto } from './dto';
import { multerConfig } from '../cloudinary/multer.config';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  @Get()
  @Public()
  findAll(@Query() query: ProductQueryDto): ReturnType<ProductsService['findAll']> {
    return this.productsService.findAll(query);
  }

  @Get(':slug')
  @Public()
  findBySlug(@Param('slug') slug: string): ReturnType<ProductsService['findBySlug']> {
    return this.productsService.findBySlug(slug);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateProductDto): ReturnType<ProductsService['create']> {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): ReturnType<ProductsService['update']> {
    return this.productsService.update(id, dto);
  }

  @Post(':id/deactivate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('id') id: string): ReturnType<ProductsService['deactivate']> {
    return this.productsService.deactivate(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  hardDelete(@Param('id') id: string): ReturnType<ProductsService['hardDelete']> {
    return this.productsService.hardDelete(id);
  }

  // ============================================
  // IMAGE ENDPOINTS
  // ============================================

  @Post(':id/images')
  @Roles('ADMIN')
  addImage(
    @Param('id') productId: string,
    @Body() imageData: { url: string; alt?: string },
  ): ReturnType<ProductsService['addImage']> {
    return this.productsService.addImage(productId, imageData);
  }

  @Post(':id/images/upload')
  @Roles('ADMIN')
  @Throttle({
    short: { limit: 1, ttl: 1000 }, // max 1 upload per second
    medium: { limit: 5, ttl: 10000 }, // max 5 uploads per 10 seconds
    long: { limit: 10, ttl: 60000 }, // max 10 uploads per minute
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  uploadImage(
    @Param('id') productId: string,
    @Body() dto: UploadImageDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /image\/(jpeg|png|webp)/ })
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: true,
        }),
    )
    file: Express.Multer.File,
  ): ReturnType<ProductsService['uploadImage']> {
    return this.productsService.uploadImage(productId, file, dto.alt);
  }

  @Delete(':id/images/:imageId')
  @Roles('ADMIN')
  removeImage(
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
  ): ReturnType<ProductsService['removeImage']> {
    return this.productsService.removeImage(productId, imageId);
  }
}
