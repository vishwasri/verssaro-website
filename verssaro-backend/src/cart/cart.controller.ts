import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AddBundleDto,
  AddCartItemDto,
  ApplyPromoDto,
  UpdateCartItemDto,
  UpdateCartMetaDto,
} from './cart.dto';
import { CartService } from './cart.service';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(
    @Headers('x-session-id') sessionId?: string,
    @Query('shippingMethod') shippingMethod?: string,
  ) {
    return this.cartService.getCart(sessionId, shippingMethod);
  }

  @Post('items')
  addItem(
    @Headers('x-session-id') sessionId: string | undefined,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(sessionId, dto);
  }

  @Post('bundle')
  addBundle(
    @Headers('x-session-id') sessionId: string | undefined,
    @Body() dto: AddBundleDto,
  ) {
    return this.cartService.addBundle(sessionId, dto);
  }

  @Patch('items/:id')
  updateItem(
    @Headers('x-session-id') sessionId: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(sessionId, id, dto);
  }

  @Delete('items/:id')
  removeItem(
    @Headers('x-session-id') sessionId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.cartService.removeItem(sessionId, id);
  }

  @Post('promo')
  applyPromo(
    @Headers('x-session-id') sessionId: string | undefined,
    @Body() dto: ApplyPromoDto,
  ) {
    return this.cartService.applyPromo(sessionId, dto);
  }

  @Patch('meta')
  updateMeta(
    @Headers('x-session-id') sessionId: string | undefined,
    @Body() dto: UpdateCartMetaDto,
  ) {
    return this.cartService.updateMeta(sessionId, dto);
  }
}

