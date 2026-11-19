'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Product } from '@/lib/types';
import { useStore } from '@/components/StoreContext';
import { Preloader } from '@/components/Preloader';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { Marquee } from '@/components/Marquee';
import { ManifestoSection } from '@/components/ManifestoSection';
import { CollectionGrid } from '@/components/CollectionGrid';
import { OrbitSelector } from '@/components/OrbitSelector';
import { ClothStudio } from '@/components/ClothStudio';
import { Lookbook } from '@/components/Lookbook';
import { CraftSection } from '@/components/CraftSection';
import { ContactSection } from '@/components/ContactSection';
import { Footer } from '@/components/Footer';
import { QuickViewModal } from '@/components/QuickViewModal';
import { EnquiryDrawer } from '@/components/EnquiryDrawer';

// Fallback products matching authentic VERSSARO heritage catalog
const STATIC_PRODUCTS: Product[] = [
  {
    id: 'guardian',
    slug: 'guardian-of-the-flame',
    sku: 'VS-01-GUARDIAN',
    seriesCode: 'SERIES: ART-01',
    name: 'Guardian of the Flame',
    subtitle: 'Artist Series / 001 · Oversized Graphic Tee',
    category: 'tees',
    categoryLabel: 'Heritage Graphic Tees',
    capsule: 'Artist Series / 001',
    editionLabel: 'Artist Series / 001',
    priceUsd: 45,
    compareAtUsd: null,
    cogsUsd: 18,
    marginPercent: 60,
    gsm: 280,
    material: '100% Combed Heavy Cotton (280 GSM)',
    silhouette: 'oversized',
    description:
      'For those who carry fire. A guardian of protection and courage, mid-stride with sword and flame. Reimagined for today as a symbol of identity and bold self-expression.',
    fitNotes: 'Generous oversized silhouette. Dropped shoulders, relaxed chest.',
    careNotes: 'Cold machine wash inside out. Do not tumble dry.',
    badge: 'HERITAGE / 001',
    status: 'LIVE',
    isFeatured: true,
    isBestseller: true,
    isNewDrop: false,
    ratingAvg: 5.0,
    reviewCount: 32,
    colorways: [{ name: 'Obsidian Black', hex: '#0A0A0A', slug: 'obsidian-black' }],
    sizes: [
      { size: 'S', stock: 25, colombo: 25, london: 0, dubai: 0 },
      { size: 'M', stock: 40, colombo: 40, london: 0, dubai: 0 },
      { size: 'L', stock: 45, colombo: 45, london: 0, dubai: 0 },
      { size: 'XL', stock: 30, colombo: 30, london: 0, dubai: 0 },
      { size: 'XXL', stock: 15, colombo: 15, london: 0, dubai: 0 },
    ],
    totalStock: 155,
    images: [
      '/assets/img/p-guardian.webp',
      '/assets/img/guardian-pair.webp',
      '/assets/img/box-black.webp',
    ],
    measurements: [],
    nfcEnabled: false,
    siliconLocation: '',
    smartPerk: '',
  },
  {
    id: 'mayara',
    slug: 'mayara',
    sku: 'VS-02-MAYARA',
    seriesCode: 'SERIES: ART-02',
    name: 'Mayara',
    subtitle: 'Artist Series / 002 · The Peacock Dancer Tee',
    category: 'tees',
    categoryLabel: 'Heritage Graphic Tees',
    capsule: 'Artist Series / 002',
    editionLabel: 'Artist Series / 002',
    priceUsd: 45,
    compareAtUsd: null,
    cogsUsd: 18,
    marginPercent: 60,
    gsm: 280,
    material: '100% Combed Heavy Cotton (280 GSM)',
    silhouette: 'oversized',
    description:
      'Movement in every detail. A dancer crowned in peacock plumes, staff in hand, wrapped in a storm of colour. Vivid on black, quiet everywhere else.',
    fitNotes: 'Contemporary oversized drape. Dropped shoulder profile.',
    careNotes: 'Cold machine wash inside out. Do not bleach.',
    badge: 'BESTSELLER',
    status: 'LIVE',
    isFeatured: true,
    isBestseller: true,
    isNewDrop: false,
    ratingAvg: 4.9,
    reviewCount: 28,
    colorways: [{ name: 'Obsidian Black', hex: '#0A0A0A', slug: 'obsidian-black' }],
    sizes: [
      { size: 'S', stock: 20, colombo: 20, london: 0, dubai: 0 },
      { size: 'M', stock: 35, colombo: 35, london: 0, dubai: 0 },
      { size: 'L', stock: 40, colombo: 40, london: 0, dubai: 0 },
      { size: 'XL', stock: 25, colombo: 25, london: 0, dubai: 0 },
      { size: 'XXL', stock: 12, colombo: 12, london: 0, dubai: 0 },
    ],
    totalStock: 132,
    images: [
      '/assets/img/p-mayara.webp',
      '/assets/img/mayara-full.webp',
      '/assets/img/highlands.webp',
    ],
    measurements: [],
    nfcEnabled: false,
    siliconLocation: '',
    smartPerk: '',
  },
  {
    id: 'ivory',
    slug: 'the-ivory-edit',
    sku: 'VS-03-IVORY',
    seriesCode: 'SERIES: ART-03',
    name: 'The Ivory Edit',
    subtitle: 'Artist Series / 003 · Kandyan Dancer on Ivory',
    category: 'tees',
    categoryLabel: 'Heritage Graphic Tees',
    capsule: 'Artist Series / 003',
    editionLabel: 'Artist Series / 003',
    priceUsd: 45,
    compareAtUsd: null,
    cogsUsd: 18,
    marginPercent: 60,
    gsm: 280,
    material: '100% Unbleached Combed Heavy Cotton (280 GSM)',
    silhouette: 'oversized',
    description:
      'Art against the quiet. A Kandyan-inspired dancer in full adornment, drawn in gold, crimson and ink on a warm ivory canvas.',
    fitNotes: 'Architectural relaxed drape with structure. High crew collar.',
    careNotes: 'Wash with similar light colors. Cold gentle machine wash.',
    badge: 'LIMITED EDITION',
    status: 'LIVE',
    isFeatured: true,
    isBestseller: false,
    isNewDrop: true,
    ratingAvg: 5.0,
    reviewCount: 19,
    colorways: [{ name: 'Warm Ivory', hex: '#F3ECDE', slug: 'warm-ivory' }],
    sizes: [
      { size: 'S', stock: 18, colombo: 18, london: 0, dubai: 0 },
      { size: 'M', stock: 30, colombo: 30, london: 0, dubai: 0 },
      { size: 'L', stock: 35, colombo: 35, london: 0, dubai: 0 },
      { size: 'XL', stock: 20, colombo: 20, london: 0, dubai: 0 },
      { size: 'XXL', stock: 10, colombo: 10, london: 0, dubai: 0 },
    ],
    totalStock: 113,
    images: [
      '/assets/img/p-ivory.webp',
      '/assets/img/box-ivory.webp',
      '/assets/img/hanging-trio.webp',
    ],
    measurements: [],
    nfcEnabled: false,
    siliconLocation: '',
    smartPerk: '',
  },
  {
    id: 'highlands',
    slug: 'highlands-edition',
    sku: 'VS-04-HIGHLANDS',
    seriesCode: 'SERIES: EDT-04',
    name: 'Highlands Edition',
    subtitle: 'The Editorial / 004 · Earth Brown Heritage Tee',
    category: 'editorial',
    categoryLabel: 'Editorial Capsule',
    capsule: 'The Editorial / 004',
    editionLabel: 'The Editorial / 004',
    priceUsd: 48,
    compareAtUsd: null,
    cogsUsd: 19,
    marginPercent: 60,
    gsm: 280,
    material: '100% Combed Earth-Dyed Cotton (280 GSM)',
    silhouette: 'oversized',
    description:
      'The world is your runway. The Guardian and Mayara prints on an earth-brown base, photographed in the tea country at dusk.',
    fitNotes: 'Oversized profile with relaxed body length.',
    careNotes: 'Cold wash with mild detergent. Dry in shade.',
    badge: 'EDITORIAL DROP',
    status: 'LIVE',
    isFeatured: true,
    isBestseller: false,
    isNewDrop: true,
    ratingAvg: 4.8,
    reviewCount: 14,
    colorways: [{ name: 'Earth Brown', hex: '#5C4033', slug: 'earth-brown' }],
    sizes: [
      { size: 'S', stock: 15, colombo: 15, london: 0, dubai: 0 },
      { size: 'M', stock: 25, colombo: 25, london: 0, dubai: 0 },
      { size: 'L', stock: 30, colombo: 30, london: 0, dubai: 0 },
      { size: 'XL', stock: 18, colombo: 18, london: 0, dubai: 0 },
      { size: 'XXL', stock: 8, colombo: 8, london: 0, dubai: 0 },
    ],
    totalStock: 96,
    images: [
      '/assets/img/p-highlands.webp',
      '/assets/img/highlands.webp',
      '/assets/img/hanging-trio.webp',
    ],
    measurements: [],
    nfcEnabled: false,
    siliconLocation: '',
    smartPerk: '',
  },
];

export default function HomePage() {
  const { addToCart } = useStore();
  const [products, setProducts] = useState<Product[]>(STATIC_PRODUCTS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeStudioIndex, setActiveStudioIndex] = useState(0);

  // Fetch live products from backend API, fallback to authentic catalog
  useEffect(() => {
    apiFetch<{ items: Product[] }>('/products')
      .then((res) => {
        if (res.items && res.items.length > 0) {
          setProducts(res.items);
        }
      })
      .catch(() => {
        // use static authentic catalog
      });
  }, []);

  const handleAddToBag = async (product: Product, size: string) => {
    try {
      await addToCart({
        productId: product.id,
        size,
        colorName: product.colorways?.[0]?.name || 'Black',
        colorHex: product.colorways?.[0]?.hex || '#0A0A0A',
        quantity: 1,
      });
      setDrawerOpen(true);
    } catch {
      setDrawerOpen(true);
    }
  };

  const handleSelectFromHero = (id: string) => {
    const found = products.find((p) => p.id === id || p.slug.includes(id));
    if (found) {
      setQuickViewProduct(found);
    }
  };

  return (
    <>
      <Preloader />

      <Header onOpenDrawer={() => setDrawerOpen(true)} />

      <main id="top" className="relative z-10">
        <HeroSection onSelectProduct={handleSelectFromHero} />

        <Marquee />

        <ManifestoSection />

        <CollectionGrid
          products={products}
          onOpenQuickView={(p) => setQuickViewProduct(p)}
        />

        <OrbitSelector
          products={products}
          onOpenQuickView={(p) => setQuickViewProduct(p)}
          onSelectStudio={(idx) => setActiveStudioIndex(idx)}
          onAddToBag={handleAddToBag}
        />

        <ClothStudio
          products={products}
          activeDesignIndex={activeStudioIndex}
          onOpenQuickView={(p) => setQuickViewProduct(p)}
          onAddToBag={handleAddToBag}
        />

        <Lookbook />

        <CraftSection />

        <ContactSection onOpenDrawer={() => setDrawerOpen(true)} />
      </main>

      <Footer />

      {/* Quick View Dialog */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToBag={handleAddToBag}
      />

      {/* Enquiry & Bag Drawer */}
      <EnquiryDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
