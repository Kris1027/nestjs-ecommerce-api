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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CurrentUser, Roles } from '../../common/decorators';
import {
  CreateOrderDto,
  OrderDetailDto,
  OrderListDto,
  OrderQueryDto,
  UpdateOrderStatusDto,
} from './dto';
import { ApiErrorResponses, ApiPaginatedResponse, ApiSuccessResponse } from '../../common/swagger';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ============================================
  // CUSTOMER ENDPOINTS
  // ============================================

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create order from cart' })
  @ApiSuccessResponse(OrderDetailDto, 201, 'Order created')
  @ApiErrorResponses(400, 401, 404, 429)
  checkout(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateOrderDto,
  ): ReturnType<OrdersService['checkout']> {
    return this.ordersService.checkout(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'List current user orders' })
  @ApiPaginatedResponse(OrderListDto, 'Paginated order list')
  @ApiErrorResponses(401, 429)
  getMyOrders(
    @CurrentUser('sub') userId: string,
    @Query() query: OrderQueryDto,
  ): ReturnType<OrdersService['getMyOrders']> {
    return this.ordersService.getMyOrders(userId, query);
  }

  @Get('my/:id')
  @ApiOperation({ summary: 'Get order detail (customer)' })
  @ApiParam({ name: 'id', description: 'Order CUID' })
  @ApiSuccessResponse(OrderDetailDto, 200, 'Order retrieved')
  @ApiErrorResponses(401, 404, 429)
  getMyOrderById(
    @CurrentUser('sub') userId: string,
    @Param('id') orderId: string,
  ): ReturnType<OrdersService['getOrderById']> {
    return this.ordersService.getOrderById(orderId, userId);
  }

  @Post('my/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an order (PENDING or CONFIRMED only)' })
  @ApiParam({ name: 'id', description: 'Order CUID' })
  @ApiSuccessResponse(OrderDetailDto, 200, 'Order cancelled')
  @ApiErrorResponses(400, 401, 404, 429)
  cancelOrder(
    @CurrentUser('sub') userId: string,
    @Param('id') orderId: string,
  ): ReturnType<OrdersService['cancelOrder']> {
    return this.ordersService.cancelOrder(orderId, userId);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all orders (admin)' })
  @ApiPaginatedResponse(OrderListDto, 'Paginated order list')
  @ApiErrorResponses(401, 403, 429)
  getAllOrders(@Query() query: OrderQueryDto): ReturnType<OrdersService['getAllOrders']> {
    return this.ordersService.getAllOrders(query);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get any order detail (admin)' })
  @ApiParam({ name: 'id', description: 'Order CUID' })
  @ApiSuccessResponse(OrderDetailDto, 200, 'Order retrieved')
  @ApiErrorResponses(401, 403, 404, 429)
  getOrderById(@Param('id') orderId: string): ReturnType<OrdersService['getOrderById']> {
    return this.ordersService.getOrderById(orderId);
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update order status (admin)' })
  @ApiParam({ name: 'id', description: 'Order CUID' })
  @ApiSuccessResponse(OrderDetailDto, 200, 'Status updated')
  @ApiErrorResponses(400, 401, 403, 404, 429)
  updateOrderStatus(
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ): ReturnType<OrdersService['updateOrderStatus']> {
    return this.ordersService.updateOrderStatus(orderId, dto);
  }
}
