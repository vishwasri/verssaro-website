'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/ProductCard';
import { StorefrontShell } from '@/components/StorefrontShell';
import { apiFetch } from '@/lib/api';
import { Product } from '@/lib/types';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Items' },
  { id: 'tees', label: 'Heavyweight Tees' },
  { id: 'hoodies', label: 'Hoodies & Sweats' },
  { id: 'cargo', label: 'Pants & Cargo' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'accessories', label: 'Accessories' },
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'OS'];
const SILHOUETTE_OPTIONS = ['all', 'boxy', 'relaxed', 'tailored'];
const COLOR_OPTIONS = [
  { label: 'All', value: '', hex: 'transparent' },
  { label: 'Obsidian', value: 'black', hex: '#141414' },
  { label: 'Charcoal', value: 'charcoal', hex: '#38383A' },
  { label: 'Chalk / Bone', value: 'bone', hex: '#D8D4CD' },
  { label: 'Clay', value: 'clay', hex: '#7A5443' },
  { label: 'Slate', value: 'slate', hex: '#525254' },
];

function ShopContent({
  initialCategory,
  initialQ,
  initialNewDrop,
}: {
  initialCategory: string;
  initialQ: string;
  initialNewDrop: boolean;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [sort, setSort] = useState('featured');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [silhouette, setSilhouette] = useState('all');
  const [maxPrice, setMaxPrice] = useState(1500);
  const [newDropOnly, setNewDropOnly] = useState(initialNewDrop);
  const [filterMatrixOpen, setFilterMatrixOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const queryParamsString = (() => {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (sort !== 'featured') params.set('sort', sort);
    if (selectedSizes.length > 0) params.set('size', selectedSizes.join(','));
    if (selectedColor) params.set('color', selectedColor);
    if (silhouette !== 'all') params.set('silhouette', silhouette);
    if (maxPrice < 1500) params.set('maxPrice', String(maxPrice));
    if (newDropOnly) params.set('newDrop', 'true');
    return params.toString();
  })();

  const loading = loadedKey !== queryParamsString;

  useEffect(() => {
    let active = true;
    apiFetch<{ items: Product[] }>(`/products?${queryParamsString}`)
      .then((res) => {
        if (active) setProducts(res.items);
      })
      .finally(() => {
        if (active) setLoadedKey(queryParamsString);
      });
    return () => {
      active = false;
    };
  }, [queryParamsString]);

  const toggleSize = (sz: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sz) ? prev.filter((x) => x !== sz) : [...prev, sz],
    );
  };

  const resetFilters = () => {
    setCategory('all');
    setSearchQuery('');
    setSort('featured');
    setSelectedSizes([]);
    setSelectedColor('');
    setSilhouette('all');
    setMaxPrice(1500);
    setNewDropOnly(false);
  };

  const hasActiveFilters =
    category !== 'all' ||
    Boolean(searchQuery) ||
    selectedSizes.length > 0 ||
    Boolean(selectedColor) ||
    silhouette !== 'all' ||
    maxPrice < 1500 ||
    newDropOnly;

  return (
    <main className="w-full pt-26 bg-surface min-h-screen">
      {/* Collection Header */}
      <section className="bg-surface-container-lowest px-margin-mobile md:px-margin py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="font-data-mono text-data-mono text-outline uppercase tracking-widest">
              INDEX // COLOMBO FLAGSHIP CATALOG
            </span>
            <h1 className="font-headline-lg text-headline-lg uppercase text-on-surface">
              COLLECTION //{' '}
              {newDropOnly
                ? 'NEW DROPS'
                : CATEGORY_TABS.find((t) => t.id === category)?.label.toUpperCase() ||
                  'ALL APPAREL'}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Architectural jersey, 520 GSM French terry, and encrypted outerwear
              editions engineered in strictly limited serial runs.
            </p>
          </div>
          <div className="font-data-mono text-data-mono text-on-surface uppercase bg-surface-container-low px-4 py-2 self-start md:self-auto">
            {products.length} PIECES DISPLAYED
          </div>
        </div>
      </section>

      {/* Sticky Category Tabs + Filter Matrix Trigger + Search */}
      <section className="sticky top-[104px] z-20 bg-surface-container-low px-margin-mobile md:px-margin py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {CATEGORY_TABS.map((tab) => (
              <button
                className={`px-3.5 py-2 font-label-caps-sm text-[11px] uppercase tracking-wider whitespace-nowrap transition-colors ${
                  category === tab.id
                    ? 'bg-on-surface text-surface font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <search className="flex-1 sm:flex-initial">
              <label className="visually-hidden" htmlFor="shop-search-input">
                Filter collection by keyword or SKU
              </label>
              <input
                className="bg-surface-container-lowest px-3 py-2 font-data-mono text-[11px] text-on-surface placeholder:text-outline focus:outline-none uppercase w-full sm:w-44"
                id="shop-search-input"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="FILTER SKU / NAME..."
                type="search"
                value={searchQuery}
              />
            </search>

            <label className="visually-hidden" htmlFor="shop-sort-select">
              Sort products
            </label>
            <select
              className="bg-surface-container-lowest px-3 py-2 font-data-mono text-[11px] text-on-surface uppercase focus:outline-none"
              id="shop-sort-select"
              onChange={(e) => setSort(e.target.value)}
              value={sort}
            >
              <option value="featured">SORT: FEATURED</option>
              <option value="newest">SORT: NEW DROPS</option>
              <option value="price_asc">PRICE: LOW TO HIGH</option>
              <option value="price_desc">PRICE: HIGH TO LOW</option>
            </select>

            <button
              aria-expanded={filterMatrixOpen}
              className={`px-4 py-2 font-label-caps-sm text-[11px] uppercase tracking-widest flex items-center gap-1.5 transition-colors ${
                filterMatrixOpen
                  ? 'bg-on-surface text-surface font-bold'
                  : 'bg-surface-container-highest text-on-surface'
              }`}
              onClick={() => setFilterMatrixOpen((v) => !v)}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              <span>FILTER MATRIX</span>
            </button>
          </div>
        </div>

        {/* Expandable 4-Column Filter Matrix */}
        {filterMatrixOpen ? (
          <div className="max-w-7xl mx-auto mt-4 pt-4 bg-surface-container p-5 grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sizes */}
            <div className="space-y-2">
              <span className="font-label-caps-sm text-[10px] text-outline uppercase tracking-widest">
                SIZE AVAILABILITY
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SIZE_OPTIONS.map((sz) => (
                  <button
                    className={`px-2.5 py-1.5 font-data-mono text-[11px] uppercase transition-colors ${
                      selectedSizes.includes(sz)
                        ? 'bg-on-surface text-surface font-bold'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
                    }`}
                    key={sz}
                    onClick={() => toggleSize(sz)}
                    type="button"
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <span className="font-label-caps-sm text-[10px] text-outline uppercase tracking-widest">
                SURFACE PALETTE
              </span>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((col) => (
                  <button
                    className={`px-2.5 py-1.5 font-data-mono text-[11px] uppercase flex items-center gap-1.5 transition-colors ${
                      selectedColor === col.value
                        ? 'bg-on-surface text-surface font-bold'
                        : 'bg-surface-container-lowest text-on-surface-variant'
                    }`}
                    key={col.label}
                    onClick={() => setSelectedColor(col.value)}
                    type="button"
                  >
                    {col.value ? (
                      <span
                        className="w-2.5 h-2.5 rounded-full ring-1 ring-outline"
                        style={{ backgroundColor: col.hex }}
                      />
                    ) : null}
                    <span>{col.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Silhouette */}
            <div className="space-y-2">
              <span className="font-label-caps-sm text-[10px] text-outline uppercase tracking-widest">
                SILHOUETTE CUT
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SILHOUETTE_OPTIONS.map((sil) => (
                  <button
                    className={`px-3 py-1.5 font-data-mono text-[11px] uppercase ${
                      silhouette === sil
                        ? 'bg-on-surface text-surface font-bold'
                        : 'bg-surface-container-lowest text-on-surface-variant'
                    }`}
                    key={sil}
                    onClick={() => setSilhouette(sil)}
                    type="button"
                  >
                    {sil}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-label-caps-sm text-[10px] uppercase">
                <span className="text-outline">MAX PRICE CAP</span>
                <span className="text-on-surface font-data-mono">
                  ${maxPrice} USD
                </span>
              </div>
              <label className="visually-hidden" htmlFor="filter-price-range">
                Maximum price in USD
              </label>
              <input
                className="w-full accent-primary cursor-pointer"
                id="filter-price-range"
                max={1500}
                min={50}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                step={25}
                type="range"
                value={maxPrice}
              />
              <div className="flex justify-between font-data-mono text-[10px] text-outline">
                <span>$50</span>
                <span>$1,500</span>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Applied Parameter Chips */}
      {hasActiveFilters ? (
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin pt-6 flex flex-wrap items-center gap-2">
          <span className="font-data-mono text-[11px] text-outline uppercase">
            APPLIED PARAMETERS:
          </span>
          {category !== 'all' ? (
            <button
              className="bg-surface-container-high px-2.5 py-1 font-data-mono text-[11px] uppercase flex items-center gap-1"
              onClick={() => setCategory('all')}
              type="button"
            >
              <span>CATEGORY: {category}</span>
              <span>×</span>
            </button>
          ) : null}
          {selectedSizes.map((sz) => (
            <button
              className="bg-surface-container-high px-2.5 py-1 font-data-mono text-[11px] uppercase flex items-center gap-1"
              key={sz}
              onClick={() => toggleSize(sz)}
              type="button"
            >
              <span>SIZE: {sz}</span>
              <span>×</span>
            </button>
          ))}
          {selectedColor ? (
            <button
              className="bg-surface-container-high px-2.5 py-1 font-data-mono text-[11px] uppercase flex items-center gap-1"
              onClick={() => setSelectedColor('')}
              type="button"
            >
              <span>COLOR: {selectedColor}</span>
              <span>×</span>
            </button>
          ) : null}
          {silhouette !== 'all' ? (
            <button
              className="bg-surface-container-high px-2.5 py-1 font-data-mono text-[11px] uppercase flex items-center gap-1"
              onClick={() => setSilhouette('all')}
              type="button"
            >
              <span>CUT: {silhouette}</span>
              <span>×</span>
            </button>
          ) : null}
          {maxPrice < 1500 ? (
            <button
              className="bg-surface-container-high px-2.5 py-1 font-data-mono text-[11px] uppercase flex items-center gap-1"
              onClick={() => setMaxPrice(1500)}
              type="button"
            >
              <span>PRICE &le; ${maxPrice}</span>
              <span>×</span>
            </button>
          ) : null}
          <button
            className="text-tertiary font-data-mono text-[11px] uppercase underline ml-2"
            onClick={resetFilters}
            type="button"
          >
            CLEAR ALL
          </button>
        </div>
      ) : null}

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-margin-mobile md:px-margin py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                className="aspect-[3/4] bg-surface-container-low animate-pulse"
                key={i}
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-surface-container-low p-12 text-center space-y-4">
            <h2 className="font-headline-sm text-headline-sm uppercase text-on-surface">
              NO ARCHIVE PIECES MATCH CURRENT PARAMETERS
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Reset the matrix parameters to view full Colombo flagship stock.
            </p>
            <button
              className="bg-on-surface text-surface px-6 py-3 font-label-caps-lg text-label-caps-lg uppercase font-bold"
              onClick={resetFilters}
              type="button"
            >
              RESET FILTERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Responsible Archival Protocol Banner */}
      <section className="bg-surface-container-lowest py-12 px-margin-mobile md:px-margin">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-2xl">
            <span className="font-data-mono text-[11px] text-outline uppercase tracking-widest">
              RESPONSIBLE ARCHIVAL PROTOCOL // SMALL-BATCH MILLING
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Zero synthetic blends used in base tee and fleece garments. Every
              numbered edition carries a hardware HF NFC silicon seal redeemable
              for complimentary Colombo Atelier care.
            </p>
          </div>
          <span className="font-data-mono text-[11px] text-primary-fixed uppercase bg-surface-container px-4 py-2 shrink-0">
            ISO-COMBED ORGANIC YARN // BATCH SERIALIZED
          </span>
        </div>
      </section>
    </main>
  );
}

function ShopRouterContent() {
  const searchParams = useSearchParams();
  return (
    <ShopContent
      initialCategory={searchParams.get('category') || 'all'}
      initialNewDrop={searchParams.get('newDrop') === 'true'}
      initialQ={searchParams.get('q') || ''}
      key={searchParams.toString()}
    />
  );
}

export default function ShopPage() {
  return (
    <StorefrontShell>
      <Suspense
        fallback={
          <div className="pt-36 px-8 text-center font-data-mono text-outline uppercase">
            LOADING ARCHIVE MATRIX...
          </div>
        }
      >
        <ShopRouterContent />
      </Suspense>
    </StorefrontShell>
  );
}
