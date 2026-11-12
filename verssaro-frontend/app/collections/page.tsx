'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { StorefrontShell } from '@/components/StorefrontShell';
import { apiFetch } from '@/lib/api';
import { Product } from '@/lib/types';

export default function CollectionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [capsule, setCapsule] = useState('ALL');

  useEffect(() => {
    apiFetch<{ items: Product[] }>('/products')
      .then((res) => setProducts(res.items || []))
      .catch(() => {});
  }, []);

  const visible =
    capsule === 'ALL'
      ? products
      : products.filter((p) => p.capsule === capsule);

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin py-12 space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="font-data-mono text-xs uppercase tracking-[0.2em] text-primary-fixed">
              ARCHIVAL CAPSULES // NUMBERED RELEASES
            </p>
            <h1 className="font-display-xl text-3xl md:text-display-xl uppercase">
              COLLECTIONS INDEX
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
              Explore VERSSARO numbered seasonal capsules milled in limited batches
              with embedded NTAG 424 DNA hardware authentication.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['ALL', 'ARCHIVE 01', 'CAPSULE 04', 'CORE UNIFORM'].map((cap) => (
              <button
                className={`px-4 py-2 font-label-caps-sm text-[11px] uppercase tracking-wider transition-colors ${
                  capsule === cap
                    ? 'bg-on-surface text-surface font-bold'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
                key={cap}
                onClick={() => setCapsule(cap)}
                type="button"
              >
                {cap}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Link
            className="bg-surface-container-low hover:bg-surface-container px-6 py-3 font-label-caps-sm text-xs uppercase tracking-widest"
            href="/shop"
          >
            OPEN FULL FILTER MATRIX →
          </Link>
        </div>
      </div>
    </StorefrontShell>
  );
}

