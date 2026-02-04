import {
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
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { CategoriesService } from './categories.service';
import { Public, Roles } from '../../common/decorators';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { multerConfig } from '../cloudinary/multer.config';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  @Get()
  @Public()
  findAll(@Query() query: PaginationQueryDto): ReturnType<CategoriesService['findAll']> {
    return this.categoriesService.findAll(query);
  }

  @Get('tree')
  @Public()
  findAllTree(): ReturnType<CategoriesService['findAllTree']> {
    return this.categoriesService.findAllTree();
  }

  @Get(':slug')
  @Public()
  findBySlug(@Param('slug') slug: string): ReturnType<CategoriesService['findBySlug']> {
    return this.categoriesService.findBySlug(slug);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateCategoryDto): ReturnType<CategoriesService['create']> {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): ReturnType<CategoriesService['update']> {
    return this.categoriesService.update(id, dto);
  }

  @Post(':id/deactivate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('id') id: string): ReturnType<CategoriesService['deactivate']> {
    return this.categoriesService.deactivate(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  hardDelete(@Param('id') id: string): ReturnType<CategoriesService['hardDelete']> {
    return this.categoriesService.hardDelete(id);
  }

  @Post(':id/image/upload')
  @Roles('ADMIN')
  @Throttle({
    short: { limit: 1, ttl: 1000 },
    medium: { limit: 5, ttl: 10000 },
    long: { limit: 10, ttl: 60000 },
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  uploadImage(
    @Param('id') id: string,
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
  ): ReturnType<CategoriesService['uploadImage']> {
    return this.categoriesService.uploadImage(id, file);
  }
}
