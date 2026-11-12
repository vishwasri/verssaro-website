import { Injectable, NotFoundException } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import {
  resolveSessionId,
  serializeProduct,
} from '../common/product-mapper';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';

export class ToggleWishlistDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  selectedSize?: string;

  @IsOptional()
  @IsString()
  selectedColor?: string;
}

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  async getWishlist(sessionHeader?: string) {
    const sessionId = resolveSessionId(sessionHeader);
    const rows = await this.prisma.wishlistItem.findMany({
      where: { sessionId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });

    const items = rows.map((row) => {
      const product = serializeProduct(row.product);
      return {
        id: row.id,
        productId: row.productId,
        selectedSize: row.selectedSize,
        selectedColor: row.selectedColor,
        stockState:
          product.status === 'UPCOMING'
            ? 'PRE_ORDER'
            : product.totalStock <= 8
              ? 'LOW_STOCK'
              : 'IN_STOCK',
        product,
      };
    });

    const totalValuationUsd = Number(
      items.reduce((sum, i) => sum + i.product.priceUsd, 0).toFixed(2),
    );
    const inStockCount = items.filter((i) => i.stockState === 'IN_STOCK').length;
    const lowStockCount = items.filter((i) => i.stockState === 'LOW_STOCK').length;
    const preOrderCount = items.filter((i) => i.stockState === 'PRE_ORDER').length;

    return {
      sessionId,
      items,
      summary: {
        totalCount: items.length,
        totalValuationUsd,
        inStockCount,
        lowStockCount,
        preOrderCount,
      },
    };
  }

  async toggle(sessionHeader: string | undefined, dto: ToggleWishlistDto) {
    const sessionId = resolveSessionId(sessionHeader);
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ id: dto.productId }, { slug: dto.productId }] },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.prisma.wishlistItem.findUnique({
      where: { sessionId_productId: { sessionId, productId: product.id } },
    });

    if (existing) {
      await this.prisma.wishlistItem.delete({ where: { id: existing.id } });
      return { action: 'removed', ...(await this.getWishlist(sessionId)) };
    }

    const serialized = serializeProduct(product);
    await this.prisma.wishlistItem.create({
      data: {
        sessionId,
        productId: product.id,
        selectedSize: dto.selectedSize || serialized.sizes[0]?.size || 'L',
        selectedColor:
          dto.selectedColor || serialized.colorways[0]?.name || 'Obsidian Black',
        stockState:
          product.status === 'UPCOMING'
            ? 'PRE_ORDER'
            : serialized.totalStock <= 8
              ? 'LOW_STOCK'
              : 'IN_STOCK',
      },
    });

    return { action: 'added', ...(await this.getWishlist(sessionId)) };
  }

  async remove(sessionHeader: string | undefined, id: string) {
    const sessionId = resolveSessionId(sessionHeader);
    await this.prisma.wishlistItem.deleteMany({
      where: { OR: [{ id }, { productId: id }], sessionId },
    });
    return this.getWishlist(sessionId);
  }

  async moveAllInStockToBag(sessionHeader: string | undefined) {
    const sessionId = resolveSessionId(sessionHeader);
    const current = await this.getWishlist(sessionId);
    const eligible = current.items.filter(
      (i) => i.stockState !== 'PRE_ORDER' && i.product.status === 'LIVE',
    );

    for (const item of eligible) {
      await this.cartService.addItem(sessionId, {
        productId: item.productId,
        size: item.selectedSize,
        colorName: item.selectedColor,
        quantity: 1,
      });
    }

    return {
      movedCount: eligible.length,
      cart: await this.cartService.getCart(sessionId),
      wishlist: current,
    };
  }

  async clearUnavailable(sessionHeader: string | undefined) {
    const sessionId = resolveSessionId(sessionHeader);
    const current = await this.getWishlist(sessionId);
    const removeIds = current.items
      .filter((i) => i.product.totalStock === 0 || i.product.status === 'SOLD_OUT')
      .map((i) => i.id);

    if (removeIds.length > 0) {
      await this.prisma.wishlistItem.deleteMany({
        where: { id: { in: removeIds }, sessionId },
      });
    }
    return this.getWishlist(sessionId);
  }
}

