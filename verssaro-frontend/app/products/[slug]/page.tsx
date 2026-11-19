'use client';

import React, { Suspense, use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ModalDialog } from '@/components/ModalDialog';
import { StorefrontShell } from '@/components/StorefrontShell';
import { useStore } from '@/components/StoreContext';
import { apiFetch } from '@/lib/api';
import { Product, Review } from '@/lib/types';

interface ProductDetailPayload {
  product: Product;
  reviews: Review[];
  fitSpectrum: {
    runsSmallPercent: number;
    trueToSizePercent: number;
    oversizedPercent: number;
  };
  styleItWith: Product[];
}

function ProductDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const {
    addToCart,
    toggleWishlist,
    wishlistProductIds,
    formatPrice,
    refreshCart,
    announce,
  } = useStore();

  const [data, setData] = useState<ProductDetailPayload | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('L');
  const [qty, setQty] = useState(1);

  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [motionOpen, setMotionOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [unitMetric, setUnitMetric] = useState<'CM' | 'IN'>('CM');

  const [revName, setRevName] = useState('');
  const [revTitle, setRevTitle] = useState('');
  const [revBody, setRevBody] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revFit, setRevFit] = useState<'runs_small' | 'true_to_size' | 'oversized'>(
    'true_to_size',
  );

  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);
  const loading = loadedSlug !== slug;

  useEffect(() => {
    let active = true;
    apiFetch<ProductDetailPayload>(`/products/${slug}`)
      .then((res) => {
        if (!active) return;
        setData(res);
        if (res.product.sizes.length > 0) {
          const inStock =
            res.product.sizes.find((s) => s.stock > 0) ?? res.product.sizes[0];
          setSelectedSize(inStock.size);
        }
      })
      .finally(() => {
        if (active) setLoadedSlug(slug);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <StorefrontShell>
        <div className="pt-36 pb-24 max-w-7xl mx-auto px-margin-mobile md:px-margin">
          <div className="h-[620px] bg-surface-container-low animate-pulse" />
        </div>
      </StorefrontShell>
    );
  }

  if (!data) {
    return (
      <StorefrontShell>
        <main className="pt-36 pb-24 max-w-4xl mx-auto px-margin-mobile text-center space-y-6">
          <h1 className="font-headline-lg text-headline-lg uppercase">
            ARCHIVE PIECE NOT FOUND
          </h1>
          <Link
            className="inline-block bg-on-surface text-surface px-8 py-4 font-label-caps-lg uppercase font-bold"
            href="/shop"
          >
            RETURN TO COLLECTION
          </Link>
        </main>
      </StorefrontShell>
    );
  }

  const { product, reviews, fitSpectrum, styleItWith } = data;
  const activeColor = product.colorways[selectedColorIdx] ?? product.colorways[0];
  const activeImage = product.images[activeImageIdx] ?? product.images[0] ?? '';
  const sizeObj = product.sizes.find((s) => s.size === selectedSize);
  const isWishlisted = wishlistProductIds.has(product.id);

  const handleAdd = async () => {
    await addToCart({
      productId: product.id,
      size: selectedSize,
      colorName: activeColor?.name || 'Obsidian Black',
      colorHex: activeColor?.hex || '#141414',
      quantity: qty,
    });
  };

  const handleInstantCheckout = async () => {
    await handleAdd();
    router.push('/checkout');
  };

  const handleAddBundle = async () => {
    const bundleItems = [product, ...styleItWith.slice(0, 2)].map((p) => ({
      productId: p.id,
      size: p.sizes[0]?.size || 'L',
      colorName: p.colorways[0]?.name || 'Obsidian Black',
      colorHex: p.colorways[0]?.hex || '#141414',
      quantity: 1,
    }));
    await apiFetch('/cart/bundle', {
      method: 'POST',
      body: JSON.stringify({ items: bundleItems }),
    });
    await refreshCart();
    announce('COMPLETE ARCHITECTURE LOOK ADDED TO BAG');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName.trim() || !revTitle.trim() || !revBody.trim()) return;
    await apiFetch(`/products/${product.slug}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        authorName: revName.trim(),
        rating: revRating,
        fitFeedback: revFit,
        title: revTitle.trim(),
        body: revBody.trim(),
        sizePurchased: selectedSize,
        colorPurchased: activeColor?.name || 'Obsidian Black',
      }),
    });
    const refreshed = await apiFetch<ProductDetailPayload>(
      `/products/${product.slug}`,
    );
    setData(refreshed);
    setReviewOpen(false);
    setRevName('');
    setRevTitle('');
    setRevBody('');
    announce('COLLECTOR REVIEW RECORDED');
  };

  return (
    <StorefrontShell>
      <main className="w-full pt-26 bg-surface min-h-screen">
        {/* Top Breadcrumbs + Archive Telemetry Ping */}
        <section className="bg-surface-container-lowest px-margin-mobile md:px-margin py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 font-data-mono text-[11px] uppercase">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-outline">
              <Link className="hover:text-on-surface" href="/">
                HOME
              </Link>
              <span>/</span>
              <Link
                className="hover:text-on-surface"
                href={`/shop?category=${product.category}`}
              >
                {product.categoryLabel}
              </Link>
              <span>/</span>
              <span className="text-on-surface">{product.sku}</span>
            </nav>
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ARCHIVE LOG: {product.editionLabel} VERIFIED</span>
            </div>
          </div>
        </section>

        {/* Primary Split Stage: Gallery (Left 7 cols) + Purchase Terminal (Right 5 cols) */}
        <section className="max-w-7xl mx-auto px-margin-mobile md:px-margin py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Vertical Thumbnails + Main 3:4 Editorial Frame */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails Rail */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:w-20 shrink-0 no-scrollbar">
              {product.images.map((img, i) => (
                <button
                  aria-label={`View gallery frame ${i + 1}`}
                  className={`relative aspect-[3/4] w-16 md:w-full shrink-0 overflow-hidden bg-surface-container-low transition-all ${
                    activeImageIdx === i
                      ? 'ring-2 ring-on-surface'
                      : 'opacity-65 hover:opacity-100'
                  }`}
                  key={img + i}
                  onClick={() => setActiveImageIdx(i)}
                  type="button"
                >
                  <img
                    alt={`${product.name} thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                    src={img}
                  />
                </button>
              ))}

              <button
                className="aspect-[3/4] w-16 md:w-full shrink-0 bg-surface-container-high hover:bg-surface-bright flex flex-col items-center justify-center p-2 text-center gap-1"
                onClick={() => setMotionOpen(true)}
                type="button"
              >
                <span className="material-symbols-outlined text-lg text-on-surface">
                  play_circle
                </span>
                <span className="font-data-mono text-[9px] uppercase text-on-surface-variant">
                  DRAPE REEL
                </span>
              </button>
            </div>

            {/* Primary Viewport */}
            <div className="relative flex-1 aspect-[3/4] bg-surface-container-low overflow-hidden">
              {activeImage ? (
                <img
                  alt={product.name}
                  className="w-full h-full object-cover"
                  src={activeImage}
                />
              ) : null}
              <button
                className="absolute bottom-4 right-4 bg-surface/85 backdrop-blur-md hover:bg-on-surface text-on-surface hover:text-surface px-4 py-2 font-label-caps-sm text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                onClick={() => setZoomOpen(true)}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">
                  zoom_in
                </span>
                <span>EXPAND EDITORIAL</span>
              </button>
            </div>
          </div>

          {/* Right: Sticky Purchase Control Terminal */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-data-mono text-[11px] text-outline uppercase tracking-widest">
                  {product.capsule} {'//'} {product.sku}
                </span>
                {product.badge ? (
                  <span className="bg-crimson text-on-surface px-2.5 py-0.5 font-label-caps-sm text-[10px] uppercase">
                    {product.badge}
                  </span>
                ) : null}
              </div>

              <h1 className="font-headline-lg text-headline-lg uppercase text-on-surface">
                {product.name}
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {product.subtitle}
              </p>

              <div className="pt-2 flex items-baseline justify-between gap-4">
                <div className="font-headline-md text-headline-md text-on-surface">
                  {formatPrice(product.priceUsd, true)}
                </div>
                <span className="font-data-mono text-[11px] text-outline uppercase">
                  or 4 interest-free payments of {formatPrice(product.priceUsd / 4)}
                </span>
              </div>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {product.description}
            </p>

            {/* Colorway Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between font-data-mono text-[11px] uppercase">
                <span className="text-outline">COLORWAY:</span>
                <span className="text-on-surface font-bold">
                  {activeColor?.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {product.colorways.map((cw, idx) => (
                  <button
                    aria-label={`Select colorway ${cw.name}`}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      selectedColorIdx === idx
                        ? 'ring-2 ring-on-surface ring-offset-2 ring-offset-surface scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    key={cw.slug}
                    onClick={() => setSelectedColorIdx(idx)}
                    style={{ backgroundColor: cw.hex }}
                    type="button"
                  />
                ))}
              </div>
            </div>

            {/* Size Matrix */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="font-data-mono text-[11px] uppercase">
                  <span className="text-outline">SIZE: </span>
                  <span className="text-on-surface font-bold">
                    {selectedSize}
                  </span>
                  {sizeObj ? (
                    <span className="ml-2 text-emerald-400">
                      ({sizeObj.stock} PIECES AVAILABLE)
                    </span>
                  ) : null}
                </div>
                <button
                  className="font-label-caps-sm text-[11px] uppercase tracking-wider text-on-surface underline flex items-center gap-1"
                  onClick={() => setSizeGuideOpen(true)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">
                    straighten
                  </span>
                  <span>SIZE GUIDE</span>
                </button>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {product.sizes.map((row) => (
                  <button
                    className={`py-3 font-data-mono text-data-mono uppercase transition-colors ${
                      row.stock <= 0
                        ? 'bg-surface-container-lowest text-outline line-through cursor-not-allowed'
                        : selectedSize === row.size
                          ? 'bg-on-surface text-surface font-bold'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                    }`}
                    disabled={row.stock <= 0}
                    key={row.size}
                    onClick={() => setSelectedSize(row.size)}
                    type="button"
                  >
                    {row.size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity + Primary Purchase Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-stretch gap-3">
                <div className="flex items-center bg-surface-container-low">
                  <button
                    aria-label="Decrease quantity"
                    className="w-11 h-13 flex items-center justify-center hover:bg-surface-container-high"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">
                      remove
                    </span>
                  </button>
                  <span className="w-10 text-center font-data-mono text-data-mono">
                    {qty}
                  </span>
                  <button
                    aria-label="Increase quantity"
                    className="w-11 h-13 flex items-center justify-center hover:bg-surface-container-high"
                    onClick={() => setQty((q) => Math.min(5, q + 1))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">
                      add
                    </span>
                  </button>
                </div>

                <button
                  className="flex-1 bg-on-surface hover:bg-primary-fixed text-surface font-label-caps-lg text-label-caps-lg uppercase tracking-widest font-bold py-4 transition-colors"
                  onClick={() => void handleAdd()}
                  type="button"
                >
                  ADD TO BAG — {formatPrice(product.priceUsd * qty)}
                </button>

                <button
                  aria-label="Save piece to wishlist"
                  aria-pressed={isWishlisted}
                  className="w-14 bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center text-on-surface"
                  onClick={() =>
                    void toggleWishlist({
                      productId: product.id,
                      selectedSize,
                      selectedColor: activeColor?.name || 'Obsidian Black',
                    })
                  }
                  type="button"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    favorite
                  </span>
                </button>
              </div>

              <button
                className="w-full bg-surface-container-high hover:bg-surface-bright text-on-surface py-3.5 font-label-caps-lg text-label-caps-lg uppercase tracking-widest transition-colors"
                onClick={() => void handleInstantCheckout()}
                type="button"
              >
                INSTANT CHECKOUT // VIP ALLOCATION
              </button>
            </div>

            {/* Service Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2 font-data-mono text-[11px] uppercase">
              <div className="bg-surface-container-low p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary-fixed">
                  local_shipping
                </span>
                <span>SAME-DAY COLOMBO / 3-DAY DHL</span>
              </div>
              <div className="bg-surface-container-low p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary-fixed">
                  verified
                </span>
                <span>
                  ATELIER GIFT BOX SEALED
                </span>
              </div>
            </div>

            {/* 4 Architectural Details Accordions */}
            <div className="space-y-2 pt-2">
              <details className="bg-surface-container-low p-4" open>
                <summary className="font-label-caps-lg text-label-caps-lg uppercase cursor-pointer flex items-center justify-between">
                  <span>TEXTILE ARCHITECTURE &amp; FIT</span>
                  <span className="material-symbols-outlined text-sm">
                    expand_more
                  </span>
                </summary>
                <div className="mt-3 space-y-1.5 font-body-sm text-body-sm text-on-surface-variant">
                  <p>
                    <strong className="text-on-surface">Material:</strong>{' '}
                    {product.material}
                  </p>
                  <p>
                    <strong className="text-on-surface">Fit Profile:</strong>{' '}
                    {product.fitNotes}
                  </p>
                </div>
              </details>

              <details className="bg-surface-container-low p-4">
                <summary className="font-label-caps-lg text-label-caps-lg uppercase cursor-pointer flex items-center justify-between">
                  <span>CARE PROTOCOL</span>
                  <span className="material-symbols-outlined text-sm">
                    expand_more
                  </span>
                </summary>
                <p className="mt-3 font-body-sm text-body-sm text-on-surface-variant">
                  {product.careNotes}
                </p>
              </details>

              <details className="bg-surface-container-low p-4">
                <summary className="font-label-caps-lg text-label-caps-lg uppercase cursor-pointer flex items-center justify-between">
                  <span>NFC SILICON PROVENANCE</span>
                  <span className="material-symbols-outlined text-sm">
                    expand_more
                  </span>
                </summary>
                <div className="mt-3 space-y-1 font-data-mono text-[11px] text-on-surface-variant uppercase">
                  <p>CHIP PLACEMENT: {product.siliconLocation}</p>
                  <p>PATRON ENTITLEMENT: {product.smartPerk}</p>
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* STYLE IT WITH Bundle */}
        {styleItWith.length > 0 ? (
          <section className="bg-surface-container-lowest py-16 px-margin-mobile md:px-margin">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="font-data-mono text-[11px] text-outline uppercase tracking-widest">
                    CURATED MONOLITH LAYERING
                  </span>
                  <h2 className="font-headline-md text-headline-md uppercase text-on-surface mt-1">
                    STYLE IT WITH
                  </h2>
                </div>
                <button
                  className="bg-on-surface text-surface hover:bg-primary-fixed px-6 py-3 font-label-caps-lg text-label-caps-lg uppercase font-bold transition-colors"
                  onClick={() => void handleAddBundle()}
                  type="button"
                >
                  ADD COMPLETE LOOK TO BAG
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter">
                {styleItWith.map((item) => (
                  <Link
                    className="bg-surface-container-low hover:bg-surface-container p-4 flex items-center gap-4 transition-colors"
                    href={`/products/${item.slug}`}
                    key={item.id}
                  >
                    <img
                      alt={item.name}
                      className="w-20 h-24 object-cover bg-surface-container-highest shrink-0"
                      src={item.images[0]}
                    />
                    <div className="min-w-0 space-y-1">
                      <span className="font-data-mono text-[10px] text-outline uppercase">
                        {item.sku}
                      </span>
                      <h3 className="font-label-caps-lg text-label-caps-lg uppercase text-on-surface truncate">
                        {item.name}
                      </h3>
                      <p className="font-data-mono text-data-mono font-bold text-primary-fixed">
                        {formatPrice(item.priceUsd)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Client Archive Reviews + Fit Spectrum */}
        <section className="py-16 px-margin-mobile md:px-margin bg-surface">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="font-data-mono text-[11px] text-outline uppercase tracking-widest">
                  VERIFIED COLLECTOR FEEDBACK
                </span>
                <h2 className="font-headline-md text-headline-md uppercase text-on-surface mt-1">
                  ARCHIVE REVIEWS ({product.ratingAvg.toFixed(1)} / 5.0)
                </h2>
              </div>
              <button
                className="bg-surface-container-high hover:bg-on-surface text-on-surface hover:text-surface px-6 py-3 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors"
                onClick={() => setReviewOpen(true)}
                type="button"
              >
                + LOG COLLECTOR REVIEW
              </button>
            </div>

            {/* Fit Spectrum Bar */}
            <div className="bg-surface-container-low p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="font-data-mono text-[11px] text-outline uppercase">
                  RUNS TIGHT // {fitSpectrum.runsSmallPercent}%
                </span>
                <div className="h-1.5 bg-surface-container-lowest mt-2">
                  <div
                    className="h-full bg-outline"
                    style={{ width: `${fitSpectrum.runsSmallPercent}%` }}
                  />
                </div>
              </div>
              <div>
                <span className="font-data-mono text-[11px] text-primary-fixed uppercase">
                  ARCHITECTURAL TRUE TO SIZE // {fitSpectrum.trueToSizePercent}%
                </span>
                <div className="h-1.5 bg-surface-container-lowest mt-2">
                  <div
                    className="h-full bg-on-surface"
                    style={{ width: `${fitSpectrum.trueToSizePercent}%` }}
                  />
                </div>
              </div>
              <div>
                <span className="font-data-mono text-[11px] text-outline uppercase">
                  RELAXED BOXY // {fitSpectrum.oversizedPercent}%
                </span>
                <div className="h-1.5 bg-surface-container-lowest mt-2">
                  <div
                    className="h-full bg-gold"
                    style={{ width: `${fitSpectrum.oversizedPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {reviews.map((rev) => (
                <article
                  className="bg-surface-container-low p-6 space-y-3"
                  key={rev.id}
                >
                  <div className="flex items-center justify-between font-data-mono text-[11px]">
                    <span className="text-gold">
                      {'★'.repeat(rev.rating)}
                    </span>
                    <span className="text-emerald-400 uppercase">
                      VERIFIED BUYER
                    </span>
                  </div>
                  <h3 className="font-label-caps-lg text-label-caps-lg uppercase text-on-surface">
                    {rev.title}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {rev.body}
                  </p>
                  <div className="pt-2 font-data-mono text-[10px] text-outline uppercase">
                    {rev.authorName} · {rev.authorLocation} · SIZE{' '}
                    {rev.sizePurchased}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Size Guide Native Modal */}
      <ModalDialog
        onClose={() => setSizeGuideOpen(false)}
        open={sizeGuideOpen}
        titleId="size-guide-title"
      >
        <div className="p-6 md:p-8 space-y-6 bg-surface-container-low">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-data-mono text-[10px] text-outline uppercase">
                ATELIER DRAFTING SPECIFICATIONS
              </span>
              <h2
                className="font-headline-sm text-headline-sm uppercase"
                id="size-guide-title"
              >
                {product.name} — MEASUREMENTS
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {(['CM', 'IN'] as const).map((u) => (
                <button
                  className={`px-3 py-1 font-data-mono text-[11px] uppercase ${
                    unitMetric === u
                      ? 'bg-on-surface text-surface font-bold'
                      : 'bg-surface-container text-outline'
                  }`}
                  key={u}
                  onClick={() => setUnitMetric(u)}
                  type="button"
                >
                  {u}
                </button>
              ))}
              <button
                aria-label="Close size guide"
                className="p-1 text-outline hover:text-on-surface"
                onClick={() => setSizeGuideOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-data-mono text-data-mono">
              <thead>
                <tr className="bg-surface-container-lowest text-outline uppercase">
                  <th className="p-3" scope="col">
                    SIZE
                  </th>
                  <th className="p-3" scope="col">
                    CHEST / WAIST
                  </th>
                  <th className="p-3" scope="col">
                    LENGTH
                  </th>
                  <th className="p-3" scope="col">
                    SHOULDER / RISE
                  </th>
                  <th className="p-3" scope="col">
                    SLEEVE / HEM
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {product.measurements.map((m) => (
                  <tr key={m.size}>
                    <th className="p-3 text-on-surface font-bold" scope="row">
                      {m.size}
                    </th>
                    <td className="p-3 text-on-surface-variant">
                      {unitMetric === 'CM' ? m.chest : `${m.chest} (Metric)`}
                    </td>
                    <td className="p-3 text-on-surface-variant">{m.length}</td>
                    <td className="p-3 text-on-surface-variant">{m.shoulder}</td>
                    <td className="p-3 text-on-surface-variant">{m.sleeve}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ModalDialog>

      {/* Fullscreen Zoom Modal */}
      <ModalDialog
        maxWidthClass="max-w-4xl"
        onClose={() => setZoomOpen(false)}
        open={zoomOpen}
        titleId="zoom-modal-title"
      >
        <div className="bg-surface-container-lowest p-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2
              className="font-data-mono text-data-mono uppercase text-on-surface"
              id="zoom-modal-title"
            >
              EDITORIAL MACRO VIEW // {product.name}
            </h2>
            <button
              aria-label="Close zoom modal"
              className="p-1 text-outline hover:text-on-surface"
              onClick={() => setZoomOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          {activeImage ? (
            <img
              alt={`${product.name} fullscreen editorial view`}
              className="w-full max-h-[75vh] object-contain mx-auto"
              src={activeImage}
            />
          ) : null}
        </div>
      </ModalDialog>

      {/* Fabric In Motion Modal */}
      <ModalDialog
        onClose={() => setMotionOpen(false)}
        open={motionOpen}
        titleId="motion-modal-title"
      >
        <div className="bg-surface-container-low p-6 md:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <h2
              className="font-headline-sm text-headline-sm uppercase"
              id="motion-modal-title"
            >
              FABRIC DRAPE // COLOMBO RUNWAY TELEMETRY
            </h2>
            <button
              aria-label="Close fabric reel"
              className="p-1 text-outline hover:text-on-surface"
              onClick={() => setMotionOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.images.slice(0, 2).map((img, idx) => (
              <img
                alt={`${product.name} drape frame ${idx + 1}`}
                className="w-full aspect-[3/4] object-cover"
                key={idx}
                src={img}
              />
            ))}
          </div>
          <p className="font-data-mono text-data-mono text-on-surface-variant uppercase">
            {product.gsm ? `${product.gsm} GSM DENSITY // ` : ''}
            {product.material} — ENGINEERED FOR ZERO COLLAR COLLAPSE AND CLEAN
            ARCHITECTURAL CREASE.
          </p>
        </div>
      </ModalDialog>

      {/* Write Review Modal */}
      <ModalDialog
        maxWidthClass="max-w-lg"
        onClose={() => setReviewOpen(false)}
        open={reviewOpen}
        titleId="review-modal-title"
      >
        <form
          className="p-6 bg-surface-container-low space-y-4"
          onSubmit={(e) => void handleSubmitReview(e)}
        >
          <div className="flex items-center justify-between">
            <h2
              className="font-headline-sm text-headline-sm uppercase"
              id="review-modal-title"
            >
              LOG COLLECTOR ARCHIVE REVIEW
            </h2>
            <button
              aria-label="Close review form"
              className="p-1 text-outline hover:text-on-surface"
              onClick={() => setReviewOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label
              className="block font-label-caps-sm text-[10px] uppercase text-outline"
              htmlFor="rev-name"
            >
              COLLECTOR NAME
            </label>
            <input
              className="w-full bg-surface-container-lowest px-3 py-2.5 font-body-sm text-on-surface"
              id="rev-name"
              onChange={(e) => setRevName(e.target.value)}
              required
              type="text"
              value={revName}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline"
                htmlFor="rev-rating"
              >
                RATING
              </label>
              <select
                className="w-full bg-surface-container-lowest px-3 py-2.5 font-data-mono text-data-mono text-on-surface"
                id="rev-rating"
                onChange={(e) => setRevRating(Number(e.target.value))}
                value={revRating}
              >
                <option value={5}>5 STARS</option>
                <option value={4}>4 STARS</option>
                <option value={3}>3 STARS</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline"
                htmlFor="rev-fit"
              >
                FIT FEEDBACK
              </label>
              <select
                className="w-full bg-surface-container-lowest px-3 py-2.5 font-data-mono text-data-mono text-on-surface"
                id="rev-fit"
                onChange={(e) =>
                  setRevFit(
                    e.target.value as 'runs_small' | 'true_to_size' | 'oversized',
                  )
                }
                value={revFit}
              >
                <option value="true_to_size">TRUE TO SIZE</option>
                <option value="oversized">RELAXED OVERSIZED</option>
                <option value="runs_small">RUNS SNUG</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              className="block font-label-caps-sm text-[10px] uppercase text-outline"
              htmlFor="rev-title"
            >
              HEADLINE SUMMARY
            </label>
            <input
              className="w-full bg-surface-container-lowest px-3 py-2.5 font-body-sm text-on-surface"
              id="rev-title"
              onChange={(e) => setRevTitle(e.target.value)}
              required
              type="text"
              value={revTitle}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="block font-label-caps-sm text-[10px] uppercase text-outline"
              htmlFor="rev-body"
            >
              DETAILED FIELD NOTES
            </label>
            <textarea
              className="w-full bg-surface-container-lowest px-3 py-2.5 font-body-sm text-on-surface"
              id="rev-body"
              onChange={(e) => setRevBody(e.target.value)}
              required
              rows={3}
              value={revBody}
            />
          </div>

          <button
            className="w-full bg-on-surface text-surface py-3 font-label-caps-lg uppercase font-bold"
            type="submit"
          >
            PUBLISH ARCHIVE REVIEW
          </button>
        </form>
      </ModalDialog>
    </StorefrontShell>
  );
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface pt-36 pb-24 max-w-7xl mx-auto px-margin-mobile md:px-margin">
          <div className="h-[620px] bg-surface-container-low animate-pulse" />
        </div>
      }
    >
      <ProductDetailContent params={params} />
    </Suspense>
  );
}
