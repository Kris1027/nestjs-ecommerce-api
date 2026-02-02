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
import { CartService } from './cart.service';
import { CurrentUser } from '../../common/decorators';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // GET /cart - View current user's cart
  @Get()
  getCart(@CurrentUser('sub') userId: string): ReturnType<CartService['getCart']> {
    return this.cartService.getCart(userId);
  }

  // POST /cart/items - Add a product to cart
  @Post('items')
  @HttpCode(HttpStatus.OK)
  addItem(
    @CurrentUser('sub') userId: string,
    @Body() dto: AddToCartDto,
  ): ReturnType<CartService['addItem']> {
    return this.cartService.addItem(userId, dto);
  }

  // PATCH /cart/items/:itemId - Update quantity of a cart item
  @Patch('items/:itemId')
  updateItem(
    @CurrentUser('sub') userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ): ReturnType<CartService['updateItem']> {
    return this.cartService.updateItem(userId, itemId, dto);
  }

  // DELETE /cart/items/:itemId - Remove a single item from cart
  @Delete('items/:itemId')
  removeItem(
    @CurrentUser('sub') userId: string,
    @Param('itemId') itemId: string,
  ): ReturnType<CartService['removeItem']> {
    return this.cartService.removeItem(userId, itemId);
  }

  // DELETE /cart - Clear all items from cart
  @Delete()
  clearCart(@CurrentUser('sub') userId: string): ReturnType<CartService['clearCart']> {
    return this.cartService.clearCart(userId);
  }
}
