import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { serializeProduct } from '../common/product-mapper';
import { PrismaService } from '../prisma/prisma.service';

export class CreateVipClientDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  tier?: string;

  @IsOptional()
  @IsString()
  atelierHub?: string;

  @IsOptional()
  @IsString()
  liaisonName?: string;
}

export class UpdateVipClientDto {
  @IsOptional()
  @IsString()
  tier?: string;

  @IsOptional()
  @IsString()
  liaisonNotes?: string;
}

export class CreatePromoDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['VIP_WHITELIST', 'TIERED_BASKET', 'CONCIERGE', 'STANDARD', 'HERITAGE_PROMO'])
  campaignType!: string;

  @IsIn(['PERCENT', 'FIXED'])
  discountType!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  discountValue!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minSubtotalUsd?: number;

  @IsOptional()
  @IsString()
  gateTarget?: string;
}

export class UpdatePromoStatusDto {
  @IsIn(['LIVE', 'SCHEDULED', 'ARCHIVED'])
  status!: string;
}

export class NewsletterDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  source?: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardTelemetry() {
    const [products, orders, enquiries] = await Promise.all([
      this.prisma.product.findMany(),
      this.prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      this.prisma.enquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    const orderRev = orders.reduce((s, o) => s + o.totalUsd, 0);
    const serializedProducts = products.map(serializeProduct);
    const vaultAssetsUsd = serializedProducts.reduce(
      (s, p) => s + p.priceUsd * p.totalStock,
      0,
    );

    return {
      kpis: {
        grossRevenueUsd: orderRev,
        orderCount: orders.length,
        enquiryCount: enquiries.length,
        vaultAssetsUsd,
        productCount: products.length,
        hubLoads: [
          { node: 'COLOMBO ATELIER', capPercent: 95 },
        ],
      },
      dropVelocitySeries: [
        { day: 'WEEK 1', primaryMint: 25, resaleFloor: 45 },
        { day: 'WEEK 2', primaryMint: 50, resaleFloor: 45 },
        { day: 'WEEK 3', primaryMint: 85, resaleFloor: 45 },
        { day: 'WEEK 4', primaryMint: 120, resaleFloor: 45 },
      ],
      recentOrders: orders,
      recentEnquiries: enquiries,
    };
  }

  async getInventoryMatrix() {
    const products = await this.prisma.product.findMany({
      orderBy: { priceUsd: 'desc' },
    });

    const rows = products.map((p) => {
      const s = serializeProduct(p);
      const colombo = s.sizes.reduce((acc, r) => acc + (r.colombo ?? r.stock ?? 0), 0);
      const reserved = Math.min(s.totalStock, Math.max(1, Math.floor(s.totalStock * 0.1)));
      const available = Math.max(0, s.totalStock - reserved);
      return {
        productId: s.id,
        sku: s.sku,
        name: s.name,
        subtitle: s.subtitle,
        category: s.category,
        totalStock: s.totalStock,
        colombo,
        reserved,
        available,
        status: s.totalStock <= 15 ? 'LOW STOCK' : 'OPTIMAL',
        sizes: s.sizes,
      };
    });

    return { rows, movements: [] };
  }

  async listClients(tier?: string, q?: string) {
    const users = await this.prisma.user.findMany({
      include: {
        _count: { select: { orders: true, enquiries: true } },
      },
      orderBy: { totalSpendUsd: 'desc' },
    });

    const filtered = users
      .map(({ passwordHash: _omit, ...u }) => ({
        ...u,
        ordersCount: u._count.orders,
        enquiriesCount: u._count.enquiries,
      }))
      .filter((u) => {
        if (tier && tier !== 'ALL') {
          if (!u.tier.toLowerCase().includes(tier.toLowerCase())) return false;
        }
        if (q && q.trim()) {
          const term = q.trim().toLowerCase();
          return (
            u.name.toLowerCase().includes(term) ||
            u.dossierCode.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term)
          );
        }
        return true;
      });

    return {
      clients: filtered,
      summary: {
        totalClients: users.length,
        avgLtvUsd: users.length ? Number((users.reduce((s, u) => s + u.totalSpendUsd, 0) / users.length).toFixed(2)) : 0,
      },
    };
  }

  async createVipClient(dto: CreateVipClientDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Client email already exists');

    const passwordHash = await bcrypt.hash('verssaro2025', 10);
    const suffix = Math.floor(1000 + Math.random() * 8999);

    const { passwordHash: _omit, ...created } = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
        dossierCode: `DOSSIER // ${suffix}-VIP`,
        tier: dto.tier || 'HERITAGE PATRON',
        atelierHub: dto.atelierHub || 'COLOMBO FLAGSHIP',
        liaisonName: dto.liaisonName || 'LAKSHAN P.',
        storeCreditUsd: 100,
      },
    });
    return created;
  }

  async updateVipClient(id: string, dto: UpdateVipClientDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Client dossier not found');

    const { passwordHash: _omit, ...updated } = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.tier ? { tier: dto.tier } : {}),
        ...(dto.liaisonNotes !== undefined
          ? { liaisonNotes: dto.liaisonNotes }
          : {}),
      },
    });
    return updated;
  }

  async listPromotions(type?: string, q?: string) {
    const promos = await this.prisma.promoCode.findMany({
      orderBy: { attributedRevUsd: 'desc' },
    });

    const filtered = promos.filter((p) => {
      if (type && type !== 'ALL' && p.campaignType !== type) return false;
      if (q && q.trim()) {
        const term = q.trim().toLowerCase();
        return (
          p.code.toLowerCase().includes(term) ||
          p.name.toLowerCase().includes(term)
        );
      }
      return true;
    });

    return {
      promotions: filtered,
      summary: {
        activeCount: promos.filter((p) => p.status === 'LIVE').length,
        totalCount: promos.length,
        attributedRevUsd: promos.reduce((s, p) => s + p.attributedRevUsd, 0),
        claimsUsed: promos.reduce((s, p) => s + p.claimsUsed, 0),
      },
    };
  }

  async createPromotion(dto: CreatePromoDto) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.promoCode.findUnique({ where: { code } });
    if (existing) throw new ConflictException(`Promo code "${code}" exists`);

    return this.prisma.promoCode.create({
      data: {
        code,
        name: dto.name.trim(),
        description: dto.description?.trim() || 'Heritage VIP Incentive',
        campaignType: dto.campaignType,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minSubtotalUsd: dto.minSubtotalUsd ?? 0,
        gateTarget: dto.gateTarget || 'VIP Private Registry',
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async updatePromotionStatus(id: string, dto: UpdatePromoStatusDto) {
    const existing = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promotion not found');
    return this.prisma.promoCode.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async subscribeNewsletter(dto: NewsletterDto) {
    const email = dto.email.toLowerCase().trim();
    const sub = await this.prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { source: dto.source || 'FOOTER_INNER_CIRCLE' },
      create: { email, source: dto.source || 'FOOTER_INNER_CIRCLE' },
    });
    return { subscribed: true, email: sub.email };
  }
}
