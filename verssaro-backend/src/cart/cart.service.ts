import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  resolveSessionId,
  serializeProduct,
} from '../common/product-mapper';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddBundleDto,
  AddCartItemDto,
  ApplyPromoDto,
  UpdateCartItemDto,
  UpdateCartMetaDto,
} from './cart.dto';

@Injectable()
export class CartService {
  private readonly freeShippingThresholdUsd = 400;

  constructor(private readonly prisma: PrismaService) {}

  private async ensureCartSession(sessionId: string) {
    const existing = await this.prisma.cartSession.findUnique({
      where: { sessionId },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.cartSession.create({
      data: {
        sessionId,
        collectorBox: true,
        reservedUntil: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
  }

  async getCart(sessionHeader?: string, shippingMethod?: string) {
    const sessionId = resolveSessionId(sessionHeader);
    const meta = await this.ensureCartSession(sessionId);

    const rows = await this.prisma.cartItem.findMany({
      where: { sessionId },
      include: { product: true },
      orderBy: { createdAt: 'asc' },
    });

    const items = rows.map((row) => {
      const product = serializeProduct(row.product);
      const matchedSize = product.sizes.find(
        (s) => s.size.toUpperCase() === row.size.toUpperCase(),
      );
      return {
        id: row.id,
        productId: row.productId,
        slug: product.slug,
        sku: product.sku,
        name: product.name,
        category: product.category,
        badge: product.badge,
        size: row.size,
        colorName: row.colorName,
        colorHex: row.colorHex,
        quantity: row.quantity,
        unitPriceUsd: product.priceUsd,
        lineTotalUsd: Number((product.priceUsd * row.quantity).toFixed(2)),
        stockRemaining: matchedSize?.stock ?? product.totalStock,
        imageUrl: product.images[0] ?? '',
      };
    });

    const subtotalUsd = Number(
      items.reduce((sum, item) => sum + item.lineTotalUsd, 0).toFixed(2),
    );
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    let discountUsd = 0;
    let appliedPromo: {
      code: string;
      name: string;
      discountType: string;
      discountValue: number;
    } | null = null;

    if (meta.promoCode && subtotalUsd > 0) {
      const promo = await this.prisma.promoCode.findUnique({
        where: { code: meta.promoCode.toUpperCase() },
      });
      if (
        promo &&
        promo.status === 'LIVE' &&
        subtotalUsd >= promo.minSubtotalUsd
      ) {
        discountUsd =
          promo.discountType === 'PERCENT'
            ? Number(((subtotalUsd * promo.discountValue) / 100).toFixed(2))
            : Math.min(subtotalUsd, promo.discountValue);
        appliedPromo = {
          code: promo.code,
          name: promo.name,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
        };
      }
    }

    const freeShipQualified = subtotalUsd >= this.freeShippingThresholdUsd;
    const baseShipping =
      items.length === 0
        ? 0
        : shippingMethod === 'colombo_same_day'
          ? 0
          : freeShipQualified
            ? 0
            : 25;
    const totalUsd = Number(
      Math.max(0, subtotalUsd - discountUsd + baseShipping).toFixed(2),
    );
    const amountToFreeShippingUsd = Number(
      Math.max(0, this.freeShippingThresholdUsd - subtotalUsd).toFixed(2),
    );

    const existingIds = rows.map((r) => r.productId);
    const recs = await this.prisma.product.findMany({
      where: {
        status: 'LIVE',
        ...(existingIds.length > 0 ? { id: { notIn: existingIds } } : {}),
      },
      take: 4,
      orderBy: [{ category: 'asc' }, { priceUsd: 'asc' }],
    });

    return {
      sessionId,
      items,
      itemCount,
      subtotalUsd,
      discountUsd,
      shippingUsd: baseShipping,
      dutyUsd: 0,
      totalUsd,
      freeShippingThresholdUsd: this.freeShippingThresholdUsd,
      amountToFreeShippingUsd,
      freeShipQualified,
      appliedPromo,
      collectorBox: meta.collectorBox,
      giftMessage: meta.giftMessage ?? '',
      reservedUntil: meta.reservedUntil,
      youMayAlsoLike: recs.map(serializeProduct),
    };
  }

  async addItem(sessionHeader: string | undefined, dto: AddCartItemDto) {
    const sessionId = resolveSessionId(sessionHeader);
    await this.ensureCartSession(sessionId);

    const product = await this.prisma.product.findFirst({
      where: { OR: [{ id: dto.productId }, { slug: dto.productId }] },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const serialized = serializeProduct(product);
    const colorName =
      dto.colorName?.trim() || serialized.colorways[0]?.name || 'Obsidian Black';
    const colorHex =
      dto.colorHex?.trim() || serialized.colorways[0]?.hex || '#141414';
    const quantity = dto.quantity ?? 1;

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        sessionId_productId_size_colorName: {
          sessionId,
          productId: product.id,
          size: dto.size.toUpperCase(),
          colorName,
        },
      },
    });

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(10, existing.quantity + quantity) },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          sessionId,
          productId: product.id,
          size: dto.size.toUpperCase(),
          colorName,
          colorHex,
          quantity,
        },
      });
    }

    await this.prisma.cartSession.update({
      where: { sessionId },
      data: { reservedUntil: new Date(Date.now() + 15 * 60 * 1000) },
    });

    return this.getCart(sessionId);
  }

  async addBundle(sessionHeader: string | undefined, dto: AddBundleDto) {
    const sessionId = resolveSessionId(sessionHeader);
    for (const item of dto.items) {
      await this.addItem(sessionId, item);
    }
    return this.getCart(sessionId);
  }

  async updateItem(
    sessionHeader: string | undefined,
    itemId: string,
    dto: UpdateCartItemDto,
  ) {
    const sessionId = resolveSessionId(sessionHeader);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, sessionId },
    });
    if (!item) {
      throw new NotFoundException('Cart line item not found');
    }

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: dto.quantity },
    });

    return this.getCart(sessionId);
  }

  async removeItem(sessionHeader: string | undefined, itemId: string) {
    const sessionId = resolveSessionId(sessionHeader);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, sessionId },
    });
    if (!item) {
      throw new NotFoundException('Cart line item not found');
    }
    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return this.getCart(sessionId);
  }

  async applyPromo(sessionHeader: string | undefined, dto: ApplyPromoDto) {
    const sessionId = resolveSessionId(sessionHeader);
    await this.ensureCartSession(sessionId);

    const code = dto.code.trim().toUpperCase();
    if (!code) {
      await this.prisma.cartSession.update({
        where: { sessionId },
        data: { promoCode: null },
      });
      return this.getCart(sessionId);
    }

    const promo = await this.prisma.promoCode.findUnique({ where: { code } });
    if (!promo || promo.status !== 'LIVE') {
      throw new BadRequestException(`Promo code "${code}" is invalid or inactive`);
    }

    const current = await this.getCart(sessionId);
    if (current.subtotalUsd < promo.minSubtotalUsd) {
      throw new BadRequestException(
        `Promo "${code}" requires minimum subtotal of $${promo.minSubtotalUsd.toFixed(2)} USD`,
      );
    }

    await this.prisma.cartSession.update({
      where: { sessionId },
      data: { promoCode: code },
    });

    return this.getCart(sessionId);
  }

  async updateMeta(sessionHeader: string | undefined, dto: UpdateCartMetaDto) {
    const sessionId = resolveSessionId(sessionHeader);
    await this.ensureCartSession(sessionId);

    await this.prisma.cartSession.update({
      where: { sessionId },
      data: {
        ...(dto.collectorBox !== undefined
          ? { collectorBox: dto.collectorBox }
          : {}),
        ...(dto.giftMessage !== undefined
          ? { giftMessage: dto.giftMessage.slice(0, 220) }
          : {}),
      },
    });

    return this.getCart(sessionId);
  }
}

