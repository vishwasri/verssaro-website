import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { serializeProduct } from '../common/product-mapper';
import { PrismaService } from '../prisma/prisma.service';

export class TransferVaultStockDto {
  @IsString()
  productId!: string;

  @IsString()
  fromNode!: string;

  @IsString()
  toNode!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  size?: string;
}

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
  kycStatus?: string;

  @IsOptional()
  @IsString()
  liaisonNotes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  restorationPassesRemaining?: number;
}

export class CreatePromoDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['VIP_WHITELIST', 'TIERED_BASKET', 'CONCIERGE', 'STANDARD'])
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

export class LockdownDto {
  @IsBoolean()
  botLockdownActive!: boolean;
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
    const [products, orders, nfc, transfers, sys] = await Promise.all([
      this.prisma.product.findMany(),
      this.prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      this.prisma.nfcArtifact.findMany(),
      this.prisma.vaultTransfer.findMany({
        include: { artifact: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.systemConfig.findUnique({ where: { id: 'singleton' } }),
    ]);

    const orderRev = orders.reduce((s, o) => s + o.totalUsd, 0);
    const serializedProducts = products.map(serializeProduct);
    const vaultAssetsUsd = serializedProducts.reduce(
      (s, p) => s + p.priceUsd * p.totalStock,
      0,
    );
    const totalTransfersVal = transfers.reduce((s, t) => s + t.valuationUsd, 0);
    const royaltyTotal = transfers.reduce((s, t) => s + t.royaltyUsd, 0);

    return {
      botLockdownActive: sys?.botLockdownActive ?? false,
      kpis: {
        grossRevenueUsd: 482900 + orderRev,
        grossRevenueDelta: '+24.4%',
        nfcBindingsCount: 1415 + nfc.filter((n) => n.status === 'ACTIVE_BOUND').length,
        totalNfcPool: 1500,
        pendingSeedingCount: nfc.filter((n) => n.status === 'PENDING_SEEDING').length,
        p2pVolumeUsd: 184200 + totalTransfersVal,
        p2pTransfersCount: 208 + transfers.length,
        royaltyYieldUsd: 9210 + royaltyTotal,
        vaultAssetsUsd,
        hubLoads: [
          { node: 'COLOMBO FLAGSHIP', capPercent: 98 },
          { node: 'LONDON SUITE (MAYFAIR)', capPercent: 92 },
          { node: 'DUBAI PRIVATE VAULT', capPercent: 84 },
        ],
      },
      dropVelocitySeries: [
        { day: 'T-30 DAYS', primaryMint: 110, resaleFloor: 135 },
        { day: 'T-21 DAYS', primaryMint: 210, resaleFloor: 320 },
        { day: 'T-14 DAYS', primaryMint: 295, resaleFloor: 580 },
        { day: 'T-7 DAYS', primaryMint: 360, resaleFloor: 960 },
        { day: 'CURRENT RUN', primaryMint: 440, resaleFloor: 1450 },
      ],
      recentOrders: orders,
      recentTransfers: transfers,
    };
  }

  async getInventoryMatrix() {
    const [products, movements] = await Promise.all([
      this.prisma.product.findMany({ orderBy: { priceUsd: 'desc' } }),
      this.prisma.stockMovement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
    ]);

    const rows = products.map((p) => {
      const s = serializeProduct(p);
      const colombo = s.sizes.reduce((acc, r) => acc + (r.colombo ?? 0), 0);
      const london = s.sizes.reduce((acc, r) => acc + (r.london ?? 0), 0);
      const dubai = s.sizes.reduce((acc, r) => acc + (r.dubai ?? 0), 0);
      const reserved = Math.min(s.totalStock, Math.max(1, Math.floor(s.totalStock * 0.12)));
      const available = Math.max(0, s.totalStock - reserved);
      return {
        productId: s.id,
        sku: s.sku,
        name: s.name,
        subtitle: s.subtitle,
        category: s.category,
        totalStock: s.totalStock,
        colombo,
        london,
        dubai,
        reserved,
        available,
        status: s.totalStock <= 15 ? 'LOW STOCK' : 'OPTIMAL',
        sizes: s.sizes,
      };
    });

    return { rows, movements };
  }

  async transferVaultStock(dto: TransferVaultStockDto) {
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ id: dto.productId }, { sku: dto.productId }] },
    });
    if (!product) throw new NotFoundException('Product not found');

    const sizes = JSON.parse(product.sizesJson || '[]') as {
      size: string;
      stock: number;
      colombo: number;
      london: number;
      dubai: number;
    }[];

    const keyForNode = (n: string): 'colombo' | 'london' | 'dubai' => {
      const lower = n.toLowerCase();
      if (lower.includes('london')) return 'london';
      if (lower.includes('dubai')) return 'dubai';
      return 'colombo';
    };

    const fromKey = keyForNode(dto.fromNode);
    const toKey = keyForNode(dto.toNode);
    let remaining = dto.quantity;

    const updatedSizes = sizes.map((row) => {
      if (remaining <= 0) return row;
      if (dto.size && row.size.toUpperCase() !== dto.size.toUpperCase()) {
        return row;
      }
      const avail = row[fromKey] ?? 0;
      const move = Math.min(avail, remaining);
      remaining -= move;
      return {
        ...row,
        [fromKey]: avail - move,
        [toKey]: (row[toKey] ?? 0) + move,
      };
    });

    await this.prisma.product.update({
      where: { id: product.id },
      data: { sizesJson: JSON.stringify(updatedSizes) },
    });

    const movement = await this.prisma.stockMovement.create({
      data: {
        productId: product.id,
        sku: product.sku,
        garmentTitle: product.name,
        fromNode: dto.fromNode,
        toNode: dto.toNode,
        quantity: dto.quantity,
        movementType: 'INTER_VAULT',
        initiatedBy: 'ATELIER OPS // CONSOLE',
        referenceCode: `MV-2025-${Math.floor(1000 + Math.random() * 8999)}`,
        status: 'COMPLETED',
      },
    });

    return { movement, inventory: await this.getInventoryMatrix() };
  }

  async listClients(tier?: string, q?: string) {
    const users = await this.prisma.user.findMany({
      include: {
        _count: { select: { nfcArtifacts: true, orders: true } },
      },
      orderBy: { totalSpendUsd: 'desc' },
    });

    const filtered = users
      .map(({ passwordHash: _omit, ...u }) => ({
        ...u,
        piecesCount: u._count.nfcArtifacts,
        ordersCount: u._count.orders,
      }))
      .filter((u) => {
        if (tier && tier !== 'ALL') {
          if (tier === 'KYC_PENDING' && !u.kycStatus.includes('PENDING')) return false;
          if (tier === 'TIER_01' && !u.tier.includes('01')) return false;
          if (tier === 'TIER_02' && !u.tier.includes('02')) return false;
        }
        if (q && q.trim()) {
          const term = q.trim().toLowerCase();
          return (
            u.name.toLowerCase().includes(term) ||
            u.dossierCode.toLowerCase().includes(term) ||
            u.walletAddress.toLowerCase().includes(term)
          );
        }
        return true;
      });

    return {
      clients: filtered,
      summary: {
        totalClients: users.length + 478,
        tier01Count: users.filter((u) => u.tier.includes('01')).length + 22,
        tier02Count: users.filter((u) => u.tier.includes('02')).length + 116,
        avgLtvUsd: 6840,
        activePasses: users.reduce((s, u) => s + u.restorationPassesRemaining, 0) + 173,
      },
    };
  }

  async createVipClient(dto: CreateVipClientDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Client email already exists');

    const passwordHash = await bcrypt.hash('verssaro2025', 10);
    const suffix = Math.floor(1000 + Math.random() * 8999);
    const walletHex = Array.from({ length: 20 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0'),
    ).join('');

    const { passwordHash: _omit, ...created } = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
        dossierCode: `DOSSIER // ${suffix}-VIP`,
        tier: dto.tier || 'TIER 02 // SOVEREIGN VERIFIED',
        atelierHub: dto.atelierHub || 'COLOMBO 07 / LONDON',
        liaisonName: dto.liaisonName || 'LAKSHAN P.',
        walletAddress: `0x${walletHex.slice(0, 4)}...${walletHex.slice(-4)}`,
        walletFull: `0x${walletHex}`,
        storeCreditUsd: 250,
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
        ...(dto.kycStatus ? { kycStatus: dto.kycStatus } : {}),
        ...(dto.liaisonNotes !== undefined
          ? { liaisonNotes: dto.liaisonNotes }
          : {}),
        ...(dto.restorationPassesRemaining !== undefined
          ? { restorationPassesRemaining: dto.restorationPassesRemaining }
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
        description: dto.description?.trim() || 'Sovereign VIP Incentive',
        campaignType: dto.campaignType,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minSubtotalUsd: dto.minSubtotalUsd ?? 0,
        gateTarget: dto.gateTarget || 'VIP Private Registry',
        endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
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

  async setLockdown(dto: LockdownDto) {
    return this.prisma.systemConfig.upsert({
      where: { id: 'singleton' },
      update: { botLockdownActive: dto.botLockdownActive },
      create: {
        id: 'singleton',
        botLockdownActive: dto.botLockdownActive,
        maintenanceMode: false,
      },
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

