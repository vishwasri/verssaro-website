import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CartService } from '../cart/cart.service';
import { resolveSessionId } from '../common/product-mapper';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './orders.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly authService: AuthService,
  ) {}

  private serializeOrder(order: any) {
    return {
      ...order,
      shippingAddress: JSON.parse(order.shippingAddressJson || '{}'),
      packagingManifest: JSON.parse(order.packagingManifestJson || '{}'),
    };
  }

  async createOrder(
    sessionHeader: string | undefined,
    authHeader: string | undefined,
    dto: CreateOrderDto,
  ) {
    const sessionId = resolveSessionId(sessionHeader);
    const shippingMethod = dto.shippingMethod || 'colombo_same_day';
    const cart = await this.cartService.getCart(sessionId, shippingMethod);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cannot place an order with an empty bag');
    }

    const user = await this.authService.resolveUserFromTokenOrDefault(authHeader);
    const codeSuffix = (dto.countryCode || 'COL').toUpperCase().slice(0, 3);
    const randomNum = Math.floor(10000 + Math.random() * 89999);
    const orderNumber = `VR-2025-${randomNum}-${codeSuffix}`;
    const trackingNumber =
      shippingMethod === 'colombo_same_day'
        ? `ATELIER-CMB-${Math.floor(1000 + Math.random() * 8999)}`
        : `DHL-EXPRESS-${Math.floor(1000 + Math.random() * 8999)}-${codeSuffix}`;

    const created = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        sessionId,
        customerName: dto.customerName.trim(),
        email: dto.email.trim(),
        phone: dto.phone?.trim() || user.phone || null,
        status: 'PROCESSING_QC',
        paymentMethod: dto.paymentMethod || 'card',
        paymentStatus: dto.paymentMethod === 'cod' ? 'AUTHORIZED' : 'SETTLED',
        shippingMethod,
        carrierName:
          shippingMethod === 'colombo_same_day'
            ? 'Colombo Atelier White-Glove Same-Day Courier'
            : 'DHL Express Priority DDP',
        trackingNumber,
        destinationCode: `${(dto.city || 'CMB').slice(0, 3).toUpperCase()}-01`,
        shippingAddressJson: JSON.stringify({
          recipientName: dto.customerName.trim(),
          addressLine1: dto.addressLine1.trim(),
          addressLine2: dto.addressLine2?.trim() || '',
          city: dto.city.trim(),
          province: dto.province?.trim() || '',
          postalCode: dto.postalCode.trim(),
          country: dto.country.trim(),
          phone: dto.phone?.trim() || '',
        }),
        packagingManifestJson: JSON.stringify({
          collectorBox: cart.collectorBox,
          dustBag: 'Heavy Unbleached Cotton Preservation Folio',
          giftMessage: dto.giftMessage ?? cart.giftMessage ?? '',
        }),
        subtotalUsd: cart.subtotalUsd,
        discountUsd: cart.discountUsd,
        shippingUsd: cart.shippingUsd,
        dutyUsd: 0,
        totalUsd: cart.totalUsd,
        promoCodeUsed: cart.appliedPromo?.code ?? null,
        milestoneStep: 2,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            sku: item.sku,
            name: item.name,
            size: item.size,
            colorName: item.colorName,
            imageUrl: item.imageUrl,
            unitPrice: item.unitPriceUsd,
            quantity: item.quantity,
            lineTotal: item.lineTotalUsd,
          })),
        },
      },
      include: { items: true },
    });

    for (const item of cart.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (product) {
        const sizes = JSON.parse(product.sizesJson || '[]') as {
          size: string;
          stock: number;
          colombo: number;
          london: number;
          dubai: number;
        }[];
        const nextSizes = sizes.map((s) =>
          s.size.toUpperCase() === item.size.toUpperCase()
            ? {
                ...s,
                stock: Math.max(0, s.stock - item.quantity),
                colombo: Math.max(0, s.colombo - item.quantity),
              }
            : s,
        );
        await this.prisma.product.update({
          where: { id: product.id },
          data: { sizesJson: JSON.stringify(nextSizes) },
        });

        await this.prisma.stockMovement.create({
          data: {
            productId: product.id,
            sku: product.sku,
            garmentTitle: product.name,
            fromNode: 'Colombo Flagship',
            toNode: `${dto.city.trim()} // ${orderNumber}`,
            quantity: item.quantity,
            movementType: 'DISPATCH',
            initiatedBy: 'CHECKOUT PIPELINE',
            referenceCode: orderNumber,
            status: 'COMPLETED',
          },
        });

        if (product.nfcEnabled) {
          const hex = () =>
            Math.floor(16 + Math.random() * 239)
              .toString(16)
              .toUpperCase();
          const uid = `04:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}:80`;
          const randTag = Math.floor(1000 + Math.random() * 8999);
          await this.prisma.nfcArtifact.create({
            data: {
              uid,
              tagLabel: `NFC-9941-${randTag}`,
              keccakHash: `0x${Array.from({ length: 40 }, () =>
                Math.floor(Math.random() * 16).toString(16),
              ).join('')}`,
              tokenId: `#${randTag}-SOV`,
              productId: product.id,
              orderId: created.id,
              ownerUserId: user.id,
              garmentTitle: product.name,
              sku: product.sku,
              colorway: item.colorName,
              size: item.size,
              acquiredLabel: 'NOV 2025',
              valuationUsd: product.priceUsd,
              editionRun: product.editionLabel,
              textileSpec: product.material,
              siliconLocation: product.siliconLocation,
              smartPerk: product.smartPerk,
              warehouseNode: 'Client Custody',
              status: 'ACTIVE_BOUND',
              imageUrl: item.imageUrl,
            },
          });
        }
      }
    }

    if (cart.appliedPromo) {
      await this.prisma.promoCode.updateMany({
        where: { code: cart.appliedPromo.code },
        data: {
          claimsUsed: { increment: 1 },
          attributedRevUsd: { increment: cart.totalUsd },
        },
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { totalSpendUsd: { increment: cart.totalUsd } },
    });

    await this.prisma.cartItem.deleteMany({ where: { sessionId } });
    await this.prisma.cartSession.updateMany({
      where: { sessionId },
      data: { promoCode: null },
    });

    return this.serializeOrder(created);
  }

  async getByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ orderNumber }, { id: orderNumber }] },
      include: { items: true, nfcArtifacts: true },
    });
    if (!order) {
      throw new NotFoundException(`Order "${orderNumber}" not found`);
    }
    return this.serializeOrder(order);
  }

  async getClientOrders(authHeader?: string) {
    const user = await this.authService.resolveUserFromTokenOrDefault(authHeader);
    const orders = await this.prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true, nfcArtifacts: true },
      orderBy: { createdAt: 'desc' },
    });
    return {
      orders: orders.map((o) => this.serializeOrder(o)),
      total: orders.length,
    };
  }

  async adminList(status?: string, q?: string) {
    const all = await this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    const filtered = all.filter((order) => {
      if (status && status !== 'ALL' && order.status !== status) {
        return false;
      }
      if (q && q.trim()) {
        const term = q.trim().toLowerCase();
        return (
          order.orderNumber.toLowerCase().includes(term) ||
          order.customerName.toLowerCase().includes(term) ||
          order.trackingNumber.toLowerCase().includes(term)
        );
      }
      return true;
    });

    const counts = {
      all: all.length,
      unfulfilled: all.filter((o) => o.status === 'UNFULFILLED').length,
      processingQc: all.filter((o) => o.status === 'PROCESSING_QC').length,
      dispatched: all.filter((o) => o.status === 'DISPATCHED').length,
      delivered: all.filter((o) => o.status === 'DELIVERED').length,
      hold: all.filter((o) => o.status === 'HOLD').length,
    };

    return {
      orders: filtered.map((o) => this.serializeOrder(o)),
      counts,
    };
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Order not found');

    const stepMap: Record<string, number> = {
      UNFULFILLED: 1,
      PROCESSING_QC: 2,
      DISPATCHED: 3,
      DELIVERED: 4,
      HOLD: existing.milestoneStep,
    };

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        milestoneStep: stepMap[dto.status] ?? existing.milestoneStep,
        ...(dto.trackingNumber
          ? { trackingNumber: dto.trackingNumber.trim() }
          : {}),
      },
      include: { items: true },
    });

    return this.serializeOrder(updated);
  }

  async bulkDispatchQueued() {
    const res = await this.prisma.order.updateMany({
      where: { status: { in: ['UNFULFILLED', 'PROCESSING_QC'] } },
      data: { status: 'DISPATCHED', milestoneStep: 3 },
    });
    return { dispatchedCount: res.count };
  }
}

