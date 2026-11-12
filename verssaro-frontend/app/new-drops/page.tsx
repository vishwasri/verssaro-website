'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { StorefrontShell } from '@/components/StorefrontShell';
import { apiFetch } from '@/lib/api';
import { Product } from '@/lib/types';

export default function NewDropsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    apiFetch<{ items: Product[] }>('/products?newDrop=true')
      .then((res) => setProducts(res.items || []))
      .catch(() => {});
  }, []);

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin py-12 space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="font-data-mono text-xs uppercase tracking-[0.2em] text-primary-fixed">
              DROP 01 // FRESH ATELIER DISPATCH
            </p>
            <h1 className="font-display-xl text-3xl md:text-display-xl uppercase">
              NEW DROPS
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
              Latest heavy-gauge releases currently shipping immediately from
              Colombo Flagship #01, plus upcoming whitelist allocations.
            </p>
          </div>
          <Link
            className="bg-on-surface text-surface hover:bg-primary-fixed px-6 py-3 font-label-caps-sm text-xs uppercase tracking-widest font-bold transition-colors"
            href="/shop"
          >
            VIEW FULL CATALOG
          </Link>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </StorefrontShell>
  );
}

