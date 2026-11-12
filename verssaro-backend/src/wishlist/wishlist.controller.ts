import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ToggleWishlistDto, WishlistService } from './wishlist.service';

@ApiTags('wishlist')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(@Headers('x-session-id') sessionId?: string) {
    return this.wishlistService.getWishlist(sessionId);
  }

  @Post('toggle')
  toggle(
    @Headers('x-session-id') sessionId: string | undefined,
    @Body() dto: ToggleWishlistDto,
  ) {
    return this.wishlistService.toggle(sessionId, dto);
  }

  @Post('move-to-bag')
  moveAllToBag(@Headers('x-session-id') sessionId?: string) {
    return this.wishlistService.moveAllInStockToBag(sessionId);
  }

  @Post('clear-unavailable')
  clearUnavailable(@Headers('x-session-id') sessionId?: string) {
    return this.wishlistService.clearUnavailable(sessionId);
  }

  @Delete(':id')
  remove(
    @Headers('x-session-id') sessionId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.wishlistService.remove(sessionId, id);
  }
}

