import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Public, Roles, CurrentUser } from '../../common/decorators';
import { CreateReviewDto, UpdateReviewDto, ReviewQueryDto, AdminUpdateReviewDto } from './dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  // Anyone (even unauthenticated) can browse product reviews
  @Get('product/:productId')
  @Public()
  findByProduct(
    @Param('productId') productId: string,
    @Query() query: ReviewQueryDto,
  ): ReturnType<ReviewsService['findByProduct']> {
    return this.reviewsService.findByProduct(productId, query);
  }

  // ============================================
  // CUSTOMER ENDPOINTS (authenticated, any role)
  // ============================================

  // Customer creates a review for a product they purchased
  @Post('product/:productId')
  create(
    @CurrentUser('sub') userId: string,
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
  ): ReturnType<ReviewsService['create']> {
    return this.reviewsService.create(userId, productId, dto);
  }

  // Customer edits their own review (resets to PENDING)
  @Patch(':id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ): ReturnType<ReviewsService['update']> {
    return this.reviewsService.update(userId, id, dto);
  }

  // Customer deletes their own review
  @Delete(':id')
  delete(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ): ReturnType<ReviewsService['delete']> {
    return this.reviewsService.delete(userId, id);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  // Admin views all reviews with filters (status, rating)
  @Get('admin')
  @Roles('ADMIN')
  findAll(@Query() query: ReviewQueryDto): ReturnType<ReviewsService['findAll']> {
    return this.reviewsService.findAll(query);
  }

  // Admin approves or rejects a review
  @Patch(':id/moderate')
  @Roles('ADMIN')
  adminUpdate(
    @Param('id') id: string,
    @Body() dto: AdminUpdateReviewDto,
  ): ReturnType<ReviewsService['adminUpdate']> {
    return this.reviewsService.adminUpdate(id, dto);
  }

  // Admin permanently deletes any review
  @Delete(':id/admin')
  @Roles('ADMIN')
  adminDelete(@Param('id') id: string): ReturnType<ReviewsService['adminDelete']> {
    return this.reviewsService.adminDelete(id);
  }
}
