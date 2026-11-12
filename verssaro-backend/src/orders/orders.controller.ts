import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateOrderDto, UpdateOrderStatusDto } from './orders.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(
    @Headers('x-session-id') sessionId: string | undefined,
    @Headers('authorization') authHeader: string | undefined,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(sessionId, authHeader, dto);
  }

  @Get('my')
  getMyOrders(@Headers('authorization') authHeader?: string) {
    return this.ordersService.getClientOrders(authHeader);
  }

  @Get('confirmation/:orderNumber')
  getConfirmation(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.getByOrderNumber(orderNumber);
  }

  @Get('admin')
  adminList(@Query('status') status?: string, @Query('q') q?: string) {
    return this.ordersService.adminList(status, q);
  }

  @Post('admin/bulk-dispatch')
  bulkDispatch() {
    return this.ordersService.bulkDispatchQueued();
  }

  @Patch('admin/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}

