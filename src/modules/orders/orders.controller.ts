import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { CreateOrderDto, OrderQueryDto, UpdateOrderStatusDto } from './dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ============================================
  // CUSTOMER ENDPOINTS
  // ============================================

  // POST /orders/checkout - Create order from cart
  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  checkout(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateOrderDto,
  ): ReturnType<OrdersService['checkout']> {
    return this.ordersService.checkout(userId, dto);
  }

  // GET /orders/my - List current user's orders
  @Get('my')
  getMyOrders(
    @CurrentUser('sub') userId: string,
    @Query() query: OrderQueryDto,
  ): ReturnType<OrdersService['getMyOrders']> {
    return this.ordersService.getMyOrders(userId, query);
  }

  // GET /orders/my/:id - Get single order detail (customer)
  @Get('my/:id')
  getMyOrderById(
    @CurrentUser('sub') userId: string,
    @Param('id') orderId: string,
  ): ReturnType<OrdersService['getOrderById']> {
    return this.ordersService.getOrderById(orderId, userId);
  }

  // POST /orders/my/:id/cancel - Cancel an order (customer)
  @Post('my/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelOrder(
    @CurrentUser('sub') userId: string,
    @Param('id') orderId: string,
  ): ReturnType<OrdersService['cancelOrder']> {
    return this.ordersService.cancelOrder(orderId, userId);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  // GET /orders - List all orders (admin)
  @Get()
  @Roles('ADMIN')
  getAllOrders(@Query() query: OrderQueryDto): ReturnType<OrdersService['getAllOrders']> {
    return this.ordersService.getAllOrders(query);
  }

  // GET /orders/:id - Get any order detail (admin)
  @Get(':id')
  @Roles('ADMIN')
  getOrderById(@Param('id') orderId: string): ReturnType<OrdersService['getOrderById']> {
    return this.ordersService.getOrderById(orderId);
  }

  // PATCH /orders/:id/status - Update order status (admin)
  @Patch(':id/status')
  @Roles('ADMIN')
  updateOrderStatus(
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ): ReturnType<OrdersService['updateOrderStatus']> {
    return this.ordersService.updateOrderStatus(orderId, dto);
  }
}
