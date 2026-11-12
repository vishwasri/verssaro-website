'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { ModalDialog } from '@/components/ModalDialog';
import { useStore } from '@/components/StoreContext';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { Product } from '@/lib/types';

export default function AdminCatalogMatrixPage() {
  const { formatPrice, announce } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [query, setQuery] = useState('');

  // Batch Price Adjust modal
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchCategory, setBatchCategory] = useState('all');
  const [batchDelta, setBatchDelta] = useState('5');

  // Create Product modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('VRS-ARC02-014');
  const [newCategory, setNewCategory] = useState('outerwear');
  const [newCapsule, setNewCapsule] = useState('ARCHIVE 02');
  const [newPrice, setNewPrice] = useState('680');
  const [newCogs, setNewCogs] = useState('210');
  const [newGsm, setNewGsm] = useState('460');
  const [newMaterial, setNewMaterial] = useState('Heavy Tech Cotton Blend');
  const [creating, setCreating] = useState(false);

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('status', statusFilter);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (query.trim()) params.set('q', query.trim());
    try {
      const res = await apiFetch<{ items: Product[] }>(
        `/products?${params.toString()}`,
      );
      setProducts(res.items || []);
    } catch {
      // handled cleanly
    }
  }, [statusFilter, categoryFilter, query]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    params.set('status', statusFilter);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (query.trim()) params.set('q', query.trim());
    apiFetch<{ items: Product[] }>(`/products?${params.toString()}`)
      .then((res) => {
        if (active) setProducts(res.items || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [statusFilter, categoryFilter, query]);

  const handleStatusChange = async (id: string, nextStatus: string) => {
    try {
      await apiFetch(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadProducts();
      announce(`PRODUCT STATUS UPDATED TO ${nextStatus}`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'FAILED TO UPDATE STATUS'), 'error');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      await loadProducts();
      announce(`REMOVED ${name.toUpperCase()} FROM CATALOG`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'UNABLE TO DELETE PRODUCT'), 'error');
    }
  };

  const handleBatchPriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<{ updatedCount: number }>(
        '/products/batch-price',
        {
          method: 'POST',
          body: JSON.stringify({
            category: batchCategory === 'all' ? undefined : batchCategory,
            percentDelta: Number(batchDelta),
          }),
        },
      );
      await loadProducts();
      setBatchModalOpen(false);
      announce(
        `ADJUSTED RETAIL PRICING ACROSS ${res.updatedCount} SKUS BY ${batchDelta}%`,
      );
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'BATCH PRICE UPDATE FAILED'), 'error');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSku.trim()) return;
    setCreating(true);
    try {
      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          sku: newSku.trim().toUpperCase(),
          category: newCategory,
          capsule: newCapsule,
          priceUsd: Number(newPrice),
          cogsUsd: Number(newCogs),
          gsm: Number(newGsm),
          material: newMaterial,
          status: 'LIVE',
          badge: 'NEW DROP',
        }),
      });
      await loadProducts();
      setCreateModalOpen(false);
      setNewName('');
      announce(`DEPLOYED NEW CAPSULE PIECE // ${newName.toUpperCase()}`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'FAILED TO CREATE PRODUCT'), 'error');
    } finally {
      setCreating(false);
    }
  };

  const avgMargin =
    products.length > 0
      ? (
          products.reduce((s, p) => s + p.marginPercent, 0) / products.length
        ).toFixed(1)
      : '0.0';

  return (
    <AdminShell>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-data-mono text-[11px] text-primary-fixed uppercase tracking-[0.2em]">
              CATALOG OPERATIONS // SKU MATRIX EDITOR
            </p>
            <h1 className="font-headline-lg text-2xl md:text-headline-lg uppercase mt-1">
              PRODUCT CATALOG MATRIX
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="bg-surface-container-high hover:bg-surface-container-highest px-4 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors"
              onClick={() => setBatchModalOpen(true)}
              type="button"
            >
              BATCH PRICE ADJUST
            </button>
            <button
              className="bg-on-surface text-surface hover:bg-primary-fixed px-5 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest font-bold transition-colors"
              onClick={() => setCreateModalOpen(true)}
              type="button"
            >
              + CREATE NEW CAPSULE PIECE
            </button>
          </div>
        </header>

        {/* Summary Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              VISIBLE SKUS
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {String(products.length).padStart(2, '0')}
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              LIVE RELEASES
            </span>
            <p className="font-data-mono text-2xl text-primary-fixed mt-1">
              {products.filter((p) => p.status === 'LIVE').length}
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              AVERAGE GROSS MARGIN
            </span>
            <p className="font-data-mono text-2xl mt-1">{avgMargin}%</p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              TOTAL GLOBAL UNITS
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {products.reduce((s, p) => s + p.totalStock, 0)}
            </p>
          </div>
        </section>

        {/* Filter Toolbar */}
        <div className="bg-surface-container-low p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'LIVE', 'UPCOMING', 'DRAFT', 'SOLD_OUT'].map((st) => (
              <button
                className={`px-3.5 py-2 font-label-caps-sm text-[11px] uppercase tracking-wider transition-colors ${
                  statusFilter === st
                    ? 'bg-on-surface text-surface font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
                key={st}
                onClick={() => setStatusFilter(st)}
                type="button"
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              aria-label="Filter by garment category"
              className="bg-surface-container-highest px-3 py-2 font-data-mono text-xs uppercase focus:outline-none"
              onChange={(e) => setCategoryFilter(e.target.value)}
              value={categoryFilter}
            >
              <option value="all">ALL CATEGORIES</option>
              <option value="tees">HEAVYWEIGHT TEES</option>
              <option value="hoodies">520 GSM HOODIES</option>
              <option value="cargo">TACTICAL CARGOS</option>
              <option value="outerwear">TECHNICAL SHELLS</option>
              <option value="accessories">ACCESSORIES</option>
            </select>

            <input
              aria-label="Search SKU or title"
              className="bg-surface-container-highest px-4 py-2 font-data-mono text-xs text-on-surface placeholder:text-outline focus:outline-none"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH SKU OR PIECE..."
              value={query}
            />
          </div>
        </div>

        {/* Product Matrix Table */}
        <div className="bg-surface-container-low overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest font-label-caps-sm text-[10px] uppercase tracking-wider text-outline">
                <th className="p-4">SKU // SERIES</th>
                <th className="p-4">GARMENT &amp; CAPSULE</th>
                <th className="p-4">RETAIL // COGS</th>
                <th className="p-4">MARGIN</th>
                <th className="p-4">STOCK</th>
                <th className="p-4">LIFECYCLE STATUS</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-data-mono text-xs">
              {products.map((p) => (
                <tr
                  className="hover:bg-surface-container transition-colors"
                  key={p.id}
                >
                  <td className="p-4">
                    <p className="font-bold text-on-surface">{p.sku}</p>
                    <p className="text-[10px] text-outline">{p.seriesCode}</p>
                  </td>
                  <td className="p-4">
                    <Link
                      className="font-headline-md text-xs uppercase hover:text-primary-fixed transition-colors block"
                      href={`/products/${p.slug}`}
                    >
                      {p.name}
                    </Link>
                    <span className="text-[10px] text-outline uppercase">
                      {p.capsule} {'//'} {p.categoryLabel}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-on-surface">
                      {formatPrice(p.priceUsd)}
                    </p>
                    <p className="text-[10px] text-outline">
                      COGS: {formatPrice(p.cogsUsd)}
                    </p>
                  </td>
                  <td className="p-4 text-primary-fixed">
                    {p.marginPercent.toFixed(1)}%
                  </td>
                  <td className="p-4">{p.totalStock} UNITS</td>
                  <td className="p-4">
                    <select
                      aria-label={`Status for ${p.name}`}
                      className="bg-surface-container-highest px-2.5 py-1.5 font-data-mono text-[11px] uppercase focus:outline-none"
                      onChange={(e) =>
                        void handleStatusChange(p.id, e.target.value)
                      }
                      value={p.status}
                    >
                      <option value="LIVE">LIVE</option>
                      <option value="UPCOMING">UPCOMING</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="SOLD_OUT">SOLD OUT</option>
                    </select>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      className="bg-surface-container-high hover:bg-error-container hover:text-on-error-container px-2.5 py-1 text-[10px] uppercase transition-colors"
                      onClick={() => void handleDeleteProduct(p.id, p.name)}
                      type="button"
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Price Adjust Dialog */}
      <ModalDialog
        maxWidthClass="max-w-md"
        onClose={() => setBatchModalOpen(false)}
        open={batchModalOpen}
        titleId="batch-price-title"
      >
        <form
          className="p-6 space-y-5"
          onSubmit={(e) => void handleBatchPriceSubmit(e)}
        >
          <div className="flex justify-between items-start">
            <h2
              className="font-headline-md text-lg uppercase"
              id="batch-price-title"
            >
              BATCH PRICE ADJUSTMENT
            </h2>
            <button
              aria-label="Close"
              onClick={() => setBatchModalOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="batch-cat"
              >
                TARGET CATEGORY
              </label>
              <select
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                id="batch-cat"
                onChange={(e) => setBatchCategory(e.target.value)}
                value={batchCategory}
              >
                <option value="all">ALL CATALOG ITEMS</option>
                <option value="tees">HEAVYWEIGHT TEES</option>
                <option value="hoodies">HOODIES &amp; FLEECE</option>
                <option value="cargo">TACTICAL CARGOS</option>
                <option value="outerwear">OUTERWEAR</option>
              </select>
            </div>
            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="batch-pct"
              >
                PERCENTAGE DELTA (+ OR -)
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm"
                id="batch-pct"
                onChange={(e) => setBatchDelta(e.target.value)}
                required
                step="0.5"
                type="number"
                value={batchDelta}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 bg-on-surface text-surface hover:bg-primary-fixed py-3 font-label-caps-sm text-xs uppercase font-bold"
              type="submit"
            >
              APPLY REPRICING
            </button>
            <button
              className="bg-surface-container-high px-4 py-3 font-label-caps-sm text-xs uppercase"
              onClick={() => setBatchModalOpen(false)}
              type="button"
            >
              CANCEL
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Create New Capsule Piece Dialog */}
      <ModalDialog
        maxWidthClass="max-w-xl"
        onClose={() => setCreateModalOpen(false)}
        open={createModalOpen}
        titleId="create-product-title"
      >
        <form
          className="p-6 md:p-8 space-y-5"
          onSubmit={(e) => void handleCreateProduct(e)}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-data-mono text-[10px] text-primary-fixed uppercase">
                ATELIER RELEASE AUTHORING
              </p>
              <h2
                className="font-headline-md text-headline-md uppercase mt-1"
                id="create-product-title"
              >
                CREATE NEW CAPSULE PIECE
              </h2>
            </div>
            <button
              aria-label="Close"
              onClick={() => setCreateModalOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="new-p-name"
              >
                GARMENT TITLE *
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm"
                id="new-p-name"
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ARCHIVE 02 // MONOLITH TRENCH COAT"
                required
                value={newName}
              />
            </div>

            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="new-p-sku"
              >
                SKU IDENTIFIER *
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm"
                id="new-p-sku"
                onChange={(e) => setNewSku(e.target.value)}
                required
                value={newSku}
              />
            </div>

            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="new-p-cat"
              >
                CATEGORY
              </label>
              <select
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                id="new-p-cat"
                onChange={(e) => setNewCategory(e.target.value)}
                value={newCategory}
              >
                <option value="tees">tees</option>
                <option value="hoodies">hoodies</option>
                <option value="cargo">cargo</option>
                <option value="outerwear">outerwear</option>
                <option value="accessories">accessories</option>
              </select>
            </div>

            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="new-p-price"
              >
                RETAIL USD *
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm"
                id="new-p-price"
                min="1"
                onChange={(e) => setNewPrice(e.target.value)}
                required
                type="number"
                value={newPrice}
              />
            </div>

            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="new-p-cogs"
              >
                COGS USD *
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm"
                id="new-p-cogs"
                min="1"
                onChange={(e) => setNewCogs(e.target.value)}
                required
                type="number"
                value={newCogs}
              />
            </div>

            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="new-p-capsule"
              >
                CAPSULE SERIES
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                id="new-p-capsule"
                onChange={(e) => setNewCapsule(e.target.value)}
                value={newCapsule}
              />
            </div>

            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="new-p-gsm"
              >
                FABRIC GSM
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                id="new-p-gsm"
                onChange={(e) => setNewGsm(e.target.value)}
                type="number"
                value={newGsm}
              />
            </div>

            <div className="md:col-span-2">
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="new-p-mat"
              >
                TEXTILE SPECIFICATION
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                id="new-p-mat"
                onChange={(e) => setNewMaterial(e.target.value)}
                value={newMaterial}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 bg-on-surface text-surface hover:bg-primary-fixed py-3.5 font-label-caps-sm text-xs uppercase font-bold"
              disabled={creating}
              type="submit"
            >
              {creating ? 'MINTING SKU...' : 'PUBLISH TO LIVE STOREFRONT'}
            </button>
            <button
              className="bg-surface-container-high px-5 py-3.5 font-label-caps-sm text-xs uppercase"
              onClick={() => setCreateModalOpen(false)}
              type="button"
            >
              CANCEL
            </button>
          </div>
        </form>
      </ModalDialog>
    </AdminShell>
  );
}
