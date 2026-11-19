'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { useStore } from './StoreContext';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addToCart, toggleWishlist, wishlistProductIds, formatPrice } =
    useStore();
  const [busySize, setBusySize] = useState<string | null>(null);
  const isWishlisted = wishlistProductIds.has(product.id);
  const primaryImage = product.images[0] || '';
  const hoverImage = product.images[1] || primaryImage;
  const quickSizes = product.sizes.slice(0, 5);

  const handleQuickAdd = async (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    setBusySize(size);
    try {
      await addToCart({
        productId: product.id,
        size,
        colorName: product.colorways[0]?.name || 'Obsidian Black',
        colorHex: product.colorways[0]?.hex || '#141414',
        quantity: 1,
      });
    } finally {
      setBusySize(null);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist({
      productId: product.id,
      selectedSize: product.sizes[0]?.size || 'L',
      selectedColor: product.colorways[0]?.name || 'Obsidian Black',
    });
  };

  return (
    <article className="group flex flex-col bg-surface-container-low hover:bg-surface-container transition-colors">
      <div className="relative w-full aspect-[3/4] bg-surface-container-lowest overflow-hidden">
        <Link className="block w-full h-full" href={`/products/${product.slug}`}>
          {primaryImage ? (
            <>
              <img
                alt={product.name}
                className={`w-full h-full object-cover transition-all duration-700 ${
                  hoverImage !== primaryImage
                    ? 'group-hover:opacity-0'
                    : 'group-hover:scale-105'
                }`}
                src={primaryImage}
              />
              {hoverImage !== primaryImage ? (
                <img
                  alt={`${product.name} detail view`}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                  src={hoverImage}
                />
              ) : null}
            </>
          ) : null}
        </Link>

        {/* Top Left Editorial Badge */}
        {product.badge ? (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 font-label-caps-sm text-[10px] uppercase tracking-widest ${
              product.badge === 'NEW DROP'
                ? 'bg-crimson text-on-surface'
                : product.badge === 'LIMITED ARCHIVE'
                  ? 'bg-gold text-surface font-bold'
                  : 'bg-on-surface text-surface font-bold'
            }`}
          >
            {product.badge}
          </span>
        ) : null}

        {/* Top Right Wishlist Toggle */}
        <button
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Save ${product.name} to wishlist`
          }
          aria-pressed={isWishlisted}
          className="absolute top-3 right-3 w-9 h-9 bg-surface/85 backdrop-blur-md text-on-surface hover:bg-on-surface hover:text-surface flex items-center justify-center transition-colors"
          onClick={handleWishlist}
          type="button"
        >
          <span
            className="material-symbols-outlined text-base"
            style={{
              fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            favorite
          </span>
        </button>

        {/* Hover Quick-Add Matrix */}
        {!compact && product.status === 'LIVE' ? (
          <div className="absolute inset-x-0 bottom-0 bg-surface-container-lowest/95 backdrop-blur-md p-2.5 translate-y-full group-hover:translate-y-0 focus-within:translate-y-0 transition-transform duration-300">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="font-data-mono text-[10px] text-outline uppercase tracking-widest">
                QUICK ADD
              </span>
              <span className="font-data-mono text-[10px] text-on-surface-variant">
                {product.gsm ? `${product.gsm} GSM` : product.editionLabel}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {quickSizes.map((row) => (
                <button
                  className={`py-1.5 font-data-mono text-[11px] uppercase transition-colors ${
                    row.stock > 0
                      ? 'bg-surface-container-high hover:bg-on-surface hover:text-surface text-on-surface'
                      : 'bg-surface-container-low text-outline line-through cursor-not-allowed'
                  }`}
                  disabled={row.stock <= 0 || busySize === row.size}
                  key={row.size}
                  onClick={(e) => void handleQuickAdd(e, row.size)}
                  type="button"
                >
                  {busySize === row.size ? '·' : row.size}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="p-4 flex flex-col gap-1.5 flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-data-mono text-[10px] text-outline uppercase tracking-wider truncate">
              {product.capsule}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {product.colorways.slice(0, 3).map((cw) => (
                <span
                  aria-label={cw.name}
                  className="w-2.5 h-2.5 rounded-full ring-1 ring-outline-variant/60"
                  key={cw.slug}
                  style={{ backgroundColor: cw.hex }}
                  title={cw.name}
                />
              ))}
            </div>
          </div>
          <Link
            className="mt-1 block font-label-caps-lg text-label-caps-lg text-on-surface uppercase tracking-wider hover:text-primary transition-colors truncate"
            href={`/products/${product.slug}`}
          >
            {product.name}
          </Link>
          <p className="font-body-sm text-body-sm text-outline truncate">
            {product.subtitle}
          </p>
        </div>

        <div className="mt-2 pt-2 flex items-center justify-between bg-surface-container-low">
          <span className="font-data-mono text-body-md font-bold text-on-surface">
            {formatPrice(product.priceUsd)}
          </span>
          <span className="font-data-mono text-[10px] text-outline uppercase">
            {product.editionLabel || 'HERITAGE / 280 GSM'}
          </span>
        </div>
      </div>
    </article>
  );
}

