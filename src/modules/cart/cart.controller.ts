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
import { CartService } from './cart.service';
import { CurrentUser } from '../../common/decorators';
import { AddToCartDto, ApplyCouponDto, CartResponseDto, UpdateCartItemDto } from './dto';
import { ApiErrorResponses, ApiSuccessResponse } from '../../common/swagger';

@ApiTags('Cart')
@ApiBearerAuth('access-token')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'View current user cart' })
  @ApiSuccessResponse(CartResponseDto, 200, 'Cart retrieved')
  @ApiErrorResponses(401, 429)
  getCart(@CurrentUser('sub') userId: string): ReturnType<CartService['getCart']> {
    return this.cartService.getCart(userId);
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a product to cart' })
  @ApiSuccessResponse(CartResponseDto, 200, 'Product added to cart')
  @ApiErrorResponses(400, 401, 404, 429)
  addItem(
    @CurrentUser('sub') userId: string,
    @Body() dto: AddToCartDto,
  ): ReturnType<CartService['addItem']> {
    return this.cartService.addItem(userId, dto);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'itemId', description: 'Cart item CUID' })
  @ApiSuccessResponse(CartResponseDto, 200, 'Cart item updated')
  @ApiErrorResponses(400, 401, 404, 429)
  updateItem(
    @CurrentUser('sub') userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ): ReturnType<CartService['updateItem']> {
    return this.cartService.updateItem(userId, itemId, dto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove an item from cart' })
  @ApiParam({ name: 'itemId', description: 'Cart item CUID' })
  @ApiSuccessResponse(CartResponseDto, 200, 'Cart item removed')
  @ApiErrorResponses(401, 404, 429)
  removeItem(
    @CurrentUser('sub') userId: string,
    @Param('itemId') itemId: string,
  ): ReturnType<CartService['removeItem']> {
    return this.cartService.removeItem(userId, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiSuccessResponse(CartResponseDto, 200, 'Cart cleared')
  @ApiErrorResponses(401, 429)
  clearCart(@CurrentUser('sub') userId: string): ReturnType<CartService['clearCart']> {
    return this.cartService.clearCart(userId);
  }

  @Post('coupon')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply a coupon code to cart' })
  @ApiSuccessResponse(CartResponseDto, 200, 'Coupon applied')
  @ApiErrorResponses(400, 401, 404, 429)
  applyCoupon(
    @CurrentUser('sub') userId: string,
    @Body() dto: ApplyCouponDto,
  ): ReturnType<CartService['applyCoupon']> {
    return this.cartService.applyCoupon(userId, dto.code);
  }

  @Delete('coupon')
  @ApiOperation({ summary: 'Remove coupon from cart' })
  @ApiSuccessResponse(CartResponseDto, 200, 'Coupon removed')
  @ApiErrorResponses(401, 404, 429)
  removeCoupon(@CurrentUser('sub') userId: string): ReturnType<CartService['removeCoupon']> {
    return this.cartService.removeCoupon(userId);
  }
}
