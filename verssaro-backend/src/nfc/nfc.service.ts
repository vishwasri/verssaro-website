import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminNfcActionDto,
  BatchMintNfcDto,
  ScanNfcDto,
  TransferNfcDto,
} from './nfc.dto';

@Injectable()
export class NfcService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getVault(authHeader?: string) {
    const user = await this.authService.resolveUserFromTokenOrDefault(authHeader);
    const [artifacts, transfers] = await Promise.all([
      this.prisma.nfcArtifact.findMany({
        where: { ownerUserId: user.id, status: { not: 'BURNED' } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vaultTransfer.findMany({
        where: {
          OR: [
            { fromWallet: user.walletFull },
            { toWallet: user.walletFull },
            { fromOwnerName: user.name },
            { toOwnerName: user.name },
          ],
        },
        include: { artifact: true },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    const totalValuationUsd = Number(
      artifacts.reduce((s, a) => s + a.valuationUsd, 0).toFixed(2),
    );

    return {
      owner: {
        name: user.name,
        dossierCode: user.dossierCode,
        tier: user.tier,
        walletAddress: user.walletAddress,
        walletFull: user.walletFull,
        restorationPassesRemaining: user.restorationPassesRemaining,
        restorationPassesTotal: user.restorationPassesTotal,
      },
      metrics: {
        authenticatedCount: artifacts.length,
        totalPoolCount: artifacts.length,
        totalValuationUsd,
        contractDeployment: '0x7F91...2C4e',
        lastVerifiedLabel: '12m AGO',
      },
      artifacts,
      transfers: transfers.map((t) => ({
        ...t,
        reassignedPerks: JSON.parse(t.reassignedPerksJson || '[]'),
      })),
    };
  }

  async scanChip(dto: ScanNfcDto, authHeader?: string) {
    const user = await this.authService.resolveUserFromTokenOrDefault(authHeader);
    const query = dto.uid?.trim();

    let artifact = query
      ? await this.prisma.nfcArtifact.findFirst({
          where: { OR: [{ uid: query }, { tagLabel: query }, { id: query }] },
          include: { ownerUser: true },
        })
      : await this.prisma.nfcArtifact.findFirst({
          where: { status: 'PENDING_SEEDING' },
          include: { ownerUser: true },
        });

    if (!artifact) {
      artifact = await this.prisma.nfcArtifact.findFirst({
        include: { ownerUser: true },
      });
    }

    if (!artifact) {
      throw new NotFoundException('No NFC chip signature detected');
    }

    await this.prisma.nfcArtifact.update({
      where: { id: artifact.id },
      data: { lastVerifiedAt: new Date() },
    });

    const isOwnedByCaller = artifact.ownerUserId === user.id;

    return {
      authentic: artifact.status !== 'BURNED',
      cryptoProtocol: 'ECDSA-SECP256K1 // POLYGON ATTESTED',
      isOwnedByCaller,
      canBind: !artifact.ownerUserId || artifact.status === 'PENDING_SEEDING',
      artifact,
      telemetry: {
        rssiDbm: -42,
        siliconChip: 'NTAG 424 DNA Tamper Tag',
        blockHeight: 64819290,
        lastScannedAt: new Date().toISOString(),
      },
    };
  }

  async bindToVault(artifactIdOrUid: string, authHeader?: string) {
    const user = await this.authService.resolveUserFromTokenOrDefault(authHeader);
    const artifact = await this.prisma.nfcArtifact.findFirst({
      where: {
        OR: [
          { id: artifactIdOrUid },
          { uid: artifactIdOrUid },
          { tagLabel: artifactIdOrUid },
        ],
      },
    });
    if (!artifact) {
      throw new NotFoundException('NFC Artifact not found');
    }

    const updated = await this.prisma.nfcArtifact.update({
      where: { id: artifact.id },
      data: {
        ownerUserId: user.id,
        status: 'ACTIVE_BOUND',
        warehouseNode: 'Client Custody',
        acquiredLabel: 'NOV 2025',
        lastVerifiedAt: new Date(),
      },
    });

    const txHash = `0x${Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('')}`;
    const receiptCode = `REC-2025-${Math.floor(10000 + Math.random() * 89999)}-BND`;

    await this.prisma.vaultTransfer.create({
      data: {
        receiptCode,
        artifactId: updated.id,
        fromOwnerName: 'VERSSARO Atelier Mint',
        fromWallet: '0x00000000000000ATELIER01',
        toOwnerName: user.name,
        toWallet: user.walletFull,
        transferMethod: 'HEX',
        valuationUsd: updated.valuationUsd,
        royaltyUsd: 0,
        txHash,
        blockNumber: 64819310 + Math.floor(Math.random() * 500),
        status: 'CONFIRMED',
        reassignedPerksJson: JSON.stringify([updated.smartPerk]),
      },
    });

    return { bound: true, artifact: updated, receiptCode, txHash };
  }

  async transferProvenance(dto: TransferNfcDto, authHeader?: string) {
    const sender = await this.authService.resolveUserFromTokenOrDefault(authHeader);
    const artifact = await this.prisma.nfcArtifact.findUnique({
      where: { id: dto.artifactId },
    });
    if (!artifact) {
      throw new NotFoundException('Garment NFC artifact not found');
    }

    const cleanRecipient = dto.recipientInput.trim();
    if (!cleanRecipient) {
      throw new BadRequestException('Recipient address or handle is required');
    }

    let matchedRecipient = await this.prisma.user.findFirst({
      where: {
        OR: [
          { walletFull: cleanRecipient },
          { walletAddress: cleanRecipient },
          { dossierCode: { contains: cleanRecipient } },
          { name: { contains: cleanRecipient } },
        ],
      },
    });

    if (!matchedRecipient && cleanRecipient.toLowerCase().includes('julian')) {
      matchedRecipient = await this.prisma.user.findFirst({
        where: { email: 'julian.desilva@verssaro.vip' },
      });
    }

    const toOwnerName = matchedRecipient
      ? matchedRecipient.name
      : dto.transferMethod === 'ESCROW'
        ? 'Escrow Claim Link (Pending)'
        : cleanRecipient.slice(0, 22);

    const toWallet = matchedRecipient
      ? matchedRecipient.walletFull
      : cleanRecipient.startsWith('0x')
        ? cleanRecipient
        : `0x${Array.from({ length: 40 }, () =>
            Math.floor(Math.random() * 16).toString(16),
          ).join('')}`;

    const royaltyUsd = Number((artifact.valuationUsd * 0.05).toFixed(2));
    const receiptCode = `REC-2025-${Math.floor(10000 + Math.random() * 89999)}-COL-LON`;
    const txHash = `0x${Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('')}`;
    const blockNumber = 64819500 + Math.floor(Math.random() * 900);
    const perks = [
      artifact.smartPerk,
      'Secondary Resale Authenticity Seal',
      '24H Sovereign Early Drop Access Pass',
    ];

    const transfer = await this.prisma.vaultTransfer.create({
      data: {
        receiptCode,
        artifactId: artifact.id,
        fromOwnerName: sender.name,
        fromWallet: sender.walletFull,
        toOwnerName,
        toWallet,
        transferMethod: dto.transferMethod,
        valuationUsd: artifact.valuationUsd,
        royaltyUsd,
        gasMatic: '0.0000 MATIC',
        txHash,
        blockNumber,
        networkName: 'Polygon PoS // Atelier Rollup',
        status: dto.transferMethod === 'ESCROW' ? 'ESCROW_PENDING' : 'CONFIRMED',
        reassignedPerksJson: JSON.stringify(perks),
      },
    });

    await this.prisma.nfcArtifact.update({
      where: { id: artifact.id },
      data: {
        ownerUserId: matchedRecipient ? matchedRecipient.id : null,
        status: dto.transferMethod === 'ESCROW' ? 'IN_TRANSIT' : 'ACTIVE_BOUND',
        lastVerifiedAt: new Date(),
      },
    });

    await this.prisma.user.update({
      where: { id: sender.id },
      data: {
        recentLedgerNote: `Handed over ${artifact.garmentTitle} to ${toOwnerName} via P2P Transfer`,
      },
    });

    return {
      receipt: {
        ...transfer,
        reassignedPerks: perks,
        fromWalletShort: `${sender.walletFull.slice(0, 6)}...${sender.walletFull.slice(-4)}`,
        toWalletShort: `${toWallet.slice(0, 6)}...${toWallet.slice(-4)}`,
      },
      artifact,
    };
  }

  async redeemCarePass(authHeader?: string) {
    const user = await this.authService.resolveUserFromTokenOrDefault(authHeader);
    if (user.restorationPassesRemaining <= 0) {
      throw new BadRequestException('No remaining Atelier Restoration Passes');
    }
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { restorationPassesRemaining: { decrement: 1 } },
    });
    return {
      booked: true,
      restorationPassesRemaining: updated.restorationPassesRemaining,
      bookingRef: `CARE-CMB-${Math.floor(1000 + Math.random() * 8999)}`,
    };
  }

  async getGlobalLedger(eventType?: string) {
    const rows = await this.prisma.vaultTransfer.findMany({
      include: { artifact: true },
      orderBy: { createdAt: 'desc' },
    });

    const filtered = eventType && eventType !== 'ALL'
      ? rows.filter((r) => {
          if (eventType === 'MINT') return r.fromOwnerName.includes('Atelier');
          if (eventType === 'P2P') return !r.fromOwnerName.includes('Atelier');
          return true;
        })
      : rows;

    const totalRoyaltiesUsd = Number(
      rows.reduce((s, r) => s + r.royaltyUsd, 0).toFixed(2),
    );
    const totalVolumeUsd = Number(
      rows.reduce((s, r) => s + r.valuationUsd, 0).toFixed(2),
    );

    return {
      transfers: filtered.map((t) => ({
        ...t,
        reassignedPerks: JSON.parse(t.reassignedPerksJson || '[]'),
      })),
      stats: {
        lifetimeHandoverTxs: 1840 + rows.length,
        secondaryRoyaltiesUsd: 92400 + totalRoyaltiesUsd,
        totalVolumeUsd,
        flaggedEvents: 0,
        zkProofsVerified: 6489 + rows.length,
      },
    };
  }

  async adminInventory(status?: string, q?: string) {
    const rows = await this.prisma.nfcArtifact.findMany({
      include: { ownerUser: true },
      orderBy: { createdAt: 'desc' },
    });

    const filtered = rows.filter((a) => {
      if (status && status !== 'ALL' && a.status !== status) return false;
      if (q && q.trim()) {
        const term = q.trim().toLowerCase();
        return (
          a.uid.toLowerCase().includes(term) ||
          a.tagLabel.toLowerCase().includes(term) ||
          a.garmentTitle.toLowerCase().includes(term) ||
          a.sku.toLowerCase().includes(term)
        );
      }
      return true;
    });

    return {
      artifacts: filtered,
      summary: {
        total: rows.length,
        activeBound: rows.filter((r) => r.status === 'ACTIVE_BOUND').length,
        pendingSeeding: rows.filter((r) => r.status === 'PENDING_SEEDING').length,
        inTransit: rows.filter((r) => r.status === 'IN_TRANSIT').length,
      },
    };
  }

  async batchMint(dto: BatchMintNfcDto) {
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ id: dto.productId }, { sku: dto.productId }] },
    });
    if (!product) throw new NotFoundException('Product not found');

    const count = dto.count ?? 2;
    const images = JSON.parse(product.imagesJson || '[]') as string[];
    const created: any[] = [];

    for (let i = 0; i < count; i++) {
      const hex = () =>
        Math.floor(16 + Math.random() * 239)
          .toString(16)
          .toUpperCase();
      const uid = `04:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}:80`;
      const randTag = Math.floor(1000 + Math.random() * 8999);
      const artifact = await this.prisma.nfcArtifact.create({
        data: {
          uid,
          tagLabel: `NFC-VER09-${randTag}`,
          keccakHash: `0x${Array.from({ length: 40 }, () =>
            Math.floor(Math.random() * 16).toString(16),
          ).join('')}`,
          tokenId: `#${randTag}-MNT`,
          productId: product.id,
          garmentTitle: product.name,
          sku: product.sku,
          colorway: 'Obsidian Black',
          size: 'L',
          acquiredLabel: 'ATELIER VAULT',
          valuationUsd: product.priceUsd,
          editionRun: product.editionLabel,
          textileSpec: product.material,
          siliconLocation: product.siliconLocation,
          smartPerk: product.smartPerk,
          warehouseNode: dto.warehouseNode || 'Colombo Flagship',
          status: 'PENDING_SEEDING',
          imageUrl: images[0] || '',
        },
      });
      created.push(artifact);
    }

    return { mintedCount: created.length, artifacts: created };
  }

  async adminAction(id: string, dto: AdminNfcActionDto) {
    const artifact = await this.prisma.nfcArtifact.findUnique({ where: { id } });
    if (!artifact) throw new NotFoundException('Artifact not found');

    const nextStatus =
      dto.action === 'BURN'
        ? 'BURNED'
        : dto.action === 'ACTIVATE'
          ? 'ACTIVE_BOUND'
          : artifact.status;

    return this.prisma.nfcArtifact.update({
      where: { id },
      data: { status: nextStatus, lastVerifiedAt: new Date() },
    });
  }
}

