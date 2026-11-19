import { Product } from '@prisma/client';

export interface ProductSizeStock {
  size: string;
  stock: number;
  colombo?: number;
}

export interface SerializedProduct {
  id: string;
  slug: string;
  sku: string;
  seriesCode: string;
  name: string;
  subtitle: string;
  category: string;
  categoryLabel: string;
  capsule: string;
  editionLabel: string;
  priceUsd: number;
  compareAtUsd: number | null;
  cogsUsd: number;
  marginPercent: number;
  gsm: number | null;
  material: string;
  silhouette: string;
  description: string;
  fitNotes: string;
  careNotes: string;
  badge: string | null;
  status: string;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewDrop: boolean;
  ratingAvg: number;
  reviewCount: number;
  colorways: { name: string; hex: string; slug: string }[];
  sizes: ProductSizeStock[];
  totalStock: number;
  images: string[];
  measurements: {
    size: string;
    chest: string;
    length: string;
    shoulder: string;
    sleeve: string;
  }[];
}

function safeParseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function serializeProduct(p: Product): SerializedProduct {
  const sizes = safeParseJson<ProductSizeStock[]>(p.sizesJson, []);
  const totalStock = sizes.reduce((acc, row) => acc + (row.stock ?? 0), 0);
  const marginPercent =
    p.priceUsd > 0
      ? Number((((p.priceUsd - p.cogsUsd) / p.priceUsd) * 100).toFixed(1))
      : 0;

  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    seriesCode: p.seriesCode,
    name: p.name,
    subtitle: p.subtitle,
    category: p.category,
    categoryLabel: p.categoryLabel,
    capsule: p.capsule,
    editionLabel: p.editionLabel,
    priceUsd: p.priceUsd,
    compareAtUsd: p.compareAtUsd,
    cogsUsd: p.cogsUsd,
    marginPercent,
    gsm: p.gsm,
    material: p.material,
    silhouette: p.silhouette,
    description: p.description,
    fitNotes: p.fitNotes,
    careNotes: p.careNotes,
    badge: p.badge,
    status: p.status,
    isFeatured: p.isFeatured,
    isBestseller: p.isBestseller,
    isNewDrop: p.isNewDrop,
    ratingAvg: p.ratingAvg,
    reviewCount: p.reviewCount,
    colorways: safeParseJson(p.colorwaysJson, []),
    sizes,
    totalStock,
    images: safeParseJson<string[]>(p.imagesJson, []),
    measurements: safeParseJson(p.measurementsJson, []),
  };
}

export function resolveSessionId(sessionHeader?: string): string {
  const cleaned = sessionHeader?.trim();
  return cleaned && cleaned.length >= 3 ? cleaned : 'demo-session-aw';
}
