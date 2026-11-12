import { Injectable, NotFoundException } from '@nestjs/common';
import {
  serializeProduct,
  SerializedProduct,
} from '../common/product-mapper';
import { PrismaService } from '../prisma/prisma.service';
import {
  BatchPriceAdjustDto,
  CreateProductDto,
  CreateReviewDto,
  UpdateProductDto,
} from './products.dto';

export interface ProductFilterQuery {
  category?: string;
  capsule?: string;
  size?: string;
  color?: string;
  silhouette?: string;
  minPrice?: string;
  maxPrice?: string;
  q?: string;
  sort?: string;
  status?: string;
  featured?: string;
  bestseller?: string;
  newDrop?: string;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductFilterQuery = {}) {
    const rawProducts = await this.prisma.product.findMany({
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });

    let serialized = rawProducts.map(serializeProduct);

    if (query.status && query.status !== 'ALL') {
      serialized = serialized.filter(
        (p) => p.status.toUpperCase() === query.status!.toUpperCase(),
      );
    } else if (!query.status) {
      serialized = serialized.filter((p) => p.status !== 'DRAFT');
    }

    if (query.category && query.category !== 'all') {
      const cat = query.category.toLowerCase();
      serialized = serialized.filter((p) => p.category.toLowerCase() === cat);
    }

    if (query.capsule && query.capsule !== 'all') {
      const cap = query.capsule.toLowerCase();
      serialized = serialized.filter((p) =>
        p.capsule.toLowerCase().includes(cap),
      );
    }

    if (query.silhouette && query.silhouette !== 'all') {
      const sil = query.silhouette.toLowerCase();
      serialized = serialized.filter((p) => p.silhouette.toLowerCase() === sil);
    }

    if (query.featured === 'true') {
      serialized = serialized.filter((p) => p.isFeatured);
    }
    if (query.bestseller === 'true') {
      serialized = serialized.filter((p) => p.isBestseller);
    }
    if (query.newDrop === 'true') {
      serialized = serialized.filter((p) => p.isNewDrop);
    }

    if (query.size) {
      const sizesFilter = query.size
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      if (sizesFilter.length > 0) {
        serialized = serialized.filter((p) =>
          p.sizes.some(
            (row) =>
              sizesFilter.includes(row.size.toUpperCase()) && row.stock > 0,
          ),
        );
      }
    }

    if (query.color) {
      const c = query.color.toLowerCase();
      serialized = serialized.filter((p) =>
        p.colorways.some(
          (cw) =>
            cw.slug.toLowerCase().includes(c) ||
            cw.name.toLowerCase().includes(c),
        ),
      );
    }

    const minP = query.minPrice ? Number(query.minPrice) : null;
    const maxP = query.maxPrice ? Number(query.maxPrice) : null;
    if (minP !== null && !Number.isNaN(minP)) {
      serialized = serialized.filter((p) => p.priceUsd >= minP);
    }
    if (maxP !== null && !Number.isNaN(maxP)) {
      serialized = serialized.filter((p) => p.priceUsd <= maxP);
    }

    if (query.q && query.q.trim()) {
      const term = query.q.trim().toLowerCase();
      serialized = serialized.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.capsule.toLowerCase().includes(term) ||
          p.material.toLowerCase().includes(term) ||
          p.categoryLabel.toLowerCase().includes(term),
      );
    }

    switch (query.sort) {
      case 'price_asc':
        serialized.sort((a, b) => a.priceUsd - b.priceUsd);
        break;
      case 'price_desc':
        serialized.sort((a, b) => b.priceUsd - a.priceUsd);
        break;
      case 'newest':
        serialized.sort((a, b) =>
          a.isNewDrop === b.isNewDrop ? 0 : a.isNewDrop ? -1 : 1,
        );
        break;
      default:
        break;
    }

    return {
      items: serialized,
      total: serialized.length,
      facets: {
        categories: ['all', 'tees', 'hoodies', 'cargo', 'outerwear', 'accessories'],
        silhouettes: ['relaxed', 'boxy', 'tailored'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'OS'],
      },
    };
  }

  async findBySlug(slugOrId: string) {
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
      include: {
        reviews: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product "${slugOrId}" not found`);
    }

    const siblings = await this.prisma.product.findMany({
      where: { id: { not: product.id }, status: 'LIVE' },
      take: 3,
      orderBy: { isBestseller: 'desc' },
    });

    const totalRev = product.reviews.length;
    const fitCounts = { runs_small: 0, true_to_size: 0, oversized: 0 };
    for (const r of product.reviews) {
      if (r.fitFeedback === 'runs_small') fitCounts.runs_small += 1;
      else if (r.fitFeedback === 'oversized') fitCounts.oversized += 1;
      else fitCounts.true_to_size += 1;
    }

    const fitSpectrum = {
      runsSmallPercent: totalRev
        ? Math.round((fitCounts.runs_small / totalRev) * 100)
        : 5,
      trueToSizePercent: totalRev
        ? Math.round((fitCounts.true_to_size / totalRev) * 100)
        : 75,
      oversizedPercent: totalRev
        ? Math.round((fitCounts.oversized / totalRev) * 100)
        : 20,
    };

    return {
      product: serializeProduct(product),
      reviews: product.reviews,
      fitSpectrum,
      styleItWith: siblings.map(serializeProduct),
    };
  }

  async addReview(slugOrId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
    });
    if (!product) {
      throw new NotFoundException(`Product "${slugOrId}" not found`);
    }

    const review = await this.prisma.review.create({
      data: {
        productId: product.id,
        authorName: dto.authorName.trim(),
        authorLocation: dto.authorLocation?.trim() || 'Colombo / Verified Client',
        verifiedBuyer: true,
        rating: dto.rating,
        fitFeedback: dto.fitFeedback || 'true_to_size',
        title: dto.title.trim(),
        body: dto.body.trim(),
        sizePurchased: dto.sizePurchased || 'L',
        colorPurchased: dto.colorPurchased || 'Obsidian Black',
      },
    });

    const allReviews = await this.prisma.review.findMany({
      where: { productId: product.id },
    });
    const avg =
      allReviews.reduce((s, r) => s + r.rating, 0) /
      Math.max(allReviews.length, 1);

    await this.prisma.product.update({
      where: { id: product.id },
      data: {
        ratingAvg: Number(avg.toFixed(1)),
        reviewCount: Math.max(product.reviewCount + 1, allReviews.length),
      },
    });

    return review;
  }

  async create(dto: CreateProductDto): Promise<SerializedProduct> {
    const slug =
      dto.slug?.trim() ||
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const defaultImg =
      'https://lh3.googleusercontent.com/aida-public/AB6AXuChGL0ebqRXyBcOQ4pi2xd9zctLHMNhEN_DJ2rFb8PiqhWRAyC1gKwu7aNIuqIPYVdeAp5E5ZMcBM8Pk55YwMhRYP-63aVpHcuKrrDLal2-bkOP08r5Mc8yvNBcOe9V13Oxbb39zHfGyQ0dsnWGoHqWQPepZk7pfFhJdwiYRbbzarKBBECpGMHytkEhGsSkF6zOyPM6d1rpRCXJJUi2gN4PjcHCOV7Ddv-PXGey0yk';

    const created = await this.prisma.product.create({
      data: {
        slug,
        sku: dto.sku.trim().toUpperCase(),
        seriesCode: `SERIES: ${dto.category.slice(0, 2).toUpperCase()}-09`,
        name: dto.name.trim(),
        subtitle: dto.subtitle?.trim() || `${dto.gsm ?? 360} GSM Atelier Specification`,
        category: dto.category.toLowerCase(),
        categoryLabel: dto.categoryLabel || dto.category.toUpperCase(),
        capsule: dto.capsule || 'Archive 02: Cybernetic Drape',
        editionLabel: dto.editionLabel || 'RUN 01/50',
        priceUsd: dto.priceUsd,
        cogsUsd: dto.cogsUsd,
        gsm: dto.gsm ?? 360,
        material: dto.material || '100% Heavyweight Combed Organic Textile',
        silhouette: dto.silhouette || 'boxy',
        description:
          dto.description ||
          'Engineered at VERSSARO Colombo Atelier with encrypted NFC provenance chip.',
        fitNotes: 'Architectural luxury streetwear cut.',
        careNotes: 'Cold wash inside out or atelier specialist dry clean.',
        badge: dto.badge ?? 'NEW DROP',
        status: dto.status ?? 'LIVE',
        isFeatured: true,
        isNewDrop: true,
        colorwaysJson: JSON.stringify(
          dto.colorways?.length
            ? dto.colorways
            : [{ name: 'Obsidian Black', hex: '#131313', slug: 'obsidian-black' }],
        ),
        sizesJson: JSON.stringify(
          dto.sizes?.length
            ? dto.sizes
            : [
                { size: 'S', stock: 5, colombo: 3, london: 1, dubai: 1 },
                { size: 'M', stock: 8, colombo: 4, london: 2, dubai: 2 },
                { size: 'L', stock: 6, colombo: 3, london: 2, dubai: 1 },
                { size: 'XL', stock: 4, colombo: 2, london: 1, dubai: 1 },
              ],
        ),
        imagesJson: JSON.stringify(dto.images?.length ? dto.images : [defaultImg]),
        measurementsJson: JSON.stringify([
          { size: 'S', chest: '60 cm', length: '68 cm', shoulder: '54 cm', sleeve: '61 cm' },
          { size: 'M', chest: '63 cm', length: '70 cm', shoulder: '56 cm', sleeve: '62 cm' },
          { size: 'L', chest: '66 cm', length: '72 cm', shoulder: '58 cm', sleeve: '63 cm' },
        ]),
      },
    });
    return serializeProduct(created);
  }

  async update(id: string, dto: UpdateProductDto): Promise<SerializedProduct> {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Product ${id} not found`);

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.subtitle ? { subtitle: dto.subtitle.trim() } : {}),
        ...(dto.priceUsd !== undefined ? { priceUsd: dto.priceUsd } : {}),
        ...(dto.cogsUsd !== undefined ? { cogsUsd: dto.cogsUsd } : {}),
        ...(dto.capsule ? { capsule: dto.capsule } : {}),
        ...(dto.badge !== undefined ? { badge: dto.badge } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
        ...(dto.sizes ? { sizesJson: JSON.stringify(dto.sizes) } : {}),
      },
    });

    return serializeProduct(updated);
  }

  async batchAdjustPrices(dto: BatchPriceAdjustDto) {
    const factor = 1 + dto.percentDelta / 100;
    const products = await this.prisma.product.findMany({
      where:
        dto.category && dto.category !== 'all'
          ? { category: dto.category.toLowerCase() }
          : undefined,
    });

    await Promise.all(
      products.map((p) =>
        this.prisma.product.update({
          where: { id: p.id },
          data: {
            priceUsd: Math.max(25, Math.round(p.priceUsd * factor)),
          },
        }),
      ),
    );

    return { updatedCount: products.length, percentDelta: dto.percentDelta };
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Product ${id} not found`);
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true, id };
  }
}

