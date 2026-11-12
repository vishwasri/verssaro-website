'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DossierHeaderNav } from '@/components/DossierHeaderNav';
import { ModalDialog } from '@/components/ModalDialog';
import { useStore } from '@/components/StoreContext';
import { StorefrontShell } from '@/components/StorefrontShell';
import { apiFetch, getErrorMessage } from '@/lib/api';

type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'PRE_ORDER';

export default function WishlistPage() {
  const {
    cart,
    wishlist,
    addToCart,
    refreshWishlist,
    refreshCart,
    formatPrice,
    announce,
  } = useStore();
  const [filter, setFilter] = useState<StockFilter>('ALL');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const items = wishlist;

  const summary = useMemo(
    () => ({
      totalCount: items.length,
      totalValuationUsd: items.reduce((sum, i) => sum + i.product.priceUsd, 0),
      inStockCount: items.filter((i) => i.stockState === 'IN_STOCK').length,
      lowStockCount: items.filter((i) => i.stockState === 'LOW_STOCK').length,
      preOrderCount: items.filter((i) => i.stockState === 'PRE_ORDER').length,
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    if (filter === 'ALL') return items;
    return items.filter((item) => item.stockState === filter);
  }, [items, filter]);

  const handleMoveAllToBag = async () => {
    setBusyAction('move-all');
    try {
      const res = await apiFetch<{ movedCount: number }>(
        '/wishlist/move-to-bag',
        { method: 'POST' },
      );
      await Promise.all([refreshCart(), refreshWishlist()]);
      announce(
        `TRANSFERRED ${res.movedCount || 0} IN-STOCK ARCHIVE PIECES TO BAG`,
      );
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'UNABLE TO MOVE ITEMS TO BAG'), 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleClearUnavailable = async () => {
    setBusyAction('clear-unavailable');
    try {
      await apiFetch('/wishlist/clear-unavailable', { method: 'POST' });
      await refreshWishlist();
      announce('CLEARED UNAVAILABLE / PRE-ORDER ENTRIES FROM SAVED ARCHIVE');
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'FAILED TO CLEAR UNAVAILABLE'), 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleRemoveItem = async (id: string, name: string) => {
    setBusyAction(id);
    try {
      await apiFetch(`/wishlist/${id}`, { method: 'DELETE' });
      await refreshWishlist();
      announce(`REMOVED ${name.toUpperCase()} FROM ARCHIVE`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'FAILED TO REMOVE ITEM'), 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleAddSingleToBag = async (
    productId: string,
    size: string,
    colorName: string,
    name: string,
  ) => {
    setBusyAction(`bag-${productId}`);
    try {
      await addToCart({ productId, size, colorName, quantity: 1 });
      announce(`ADDED ${name.toUpperCase()} TO ACQUISITION BAG`);
    } finally {
      setBusyAction(null);
    }
  };

  const shareManifestUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/wishlist?dossier=${encodeURIComponent(
          cart?.sessionId || 'demo-session-aw',
        )}`
      : 'https://verssaro.com/wishlist?dossier=0842-AW';

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin py-10 space-y-8">
        <DossierHeaderNav
          activeTab="wishlist"
          rightSlot={
            <button
              className="bg-surface-container-low hover:bg-surface-container text-on-surface px-4 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors flex items-center gap-2"
              onClick={() => setShareOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">
                share
              </span>
              <span>SHARE ARCHIVE</span>
            </button>
          }
          subtitle="Private curation ledger for tracked heavyweight drops, low-inventory silhouettes, and early-window pre-orders."
          title="SAVED ARCHIVE // WISHLIST"
        />

        {/* HUD KPI Row */}
        <section
          aria-label="Saved Archive Telemetry"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-surface-container-low p-5 space-y-2">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              ARCHIVED PIECES
            </span>
            <p className="font-data-mono text-2xl text-on-surface">
              {String(summary.totalCount).padStart(2, '0')}
            </p>
          </div>
          <div className="bg-surface-container-low p-5 space-y-2">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              CURATION VALUATION
            </span>
            <p className="font-data-mono text-2xl text-primary-fixed">
              {formatPrice(summary.totalValuationUsd)}
            </p>
          </div>
          <div className="bg-surface-container-low p-5 space-y-2">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              READY TO DISPATCH
            </span>
            <p className="font-data-mono text-2xl text-on-surface">
              {String(summary.inStockCount).padStart(2, '0')} IN STOCK
            </p>
          </div>
          <div className="bg-surface-container-low p-5 space-y-2">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              CRITICAL / PRE-ORDER
            </span>
            <p className="font-data-mono text-2xl text-on-surface-variant">
              {summary.lowStockCount} LOW // {summary.preOrderCount} PRE
            </p>
          </div>
        </section>

        {/* Filter Bar + Bulk Actions */}
        <div className="bg-surface-container-low p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div
            aria-label="Stock status filters"
            className="flex flex-wrap gap-2"
            role="group"
          >
            {(
              [
                ['ALL', 'ALL SAVED'],
                ['IN_STOCK', 'IN STOCK'],
                ['LOW_STOCK', 'LOW STOCK'],
                ['PRE_ORDER', 'PRE-ORDER / UPCOMING'],
              ] as const
            ).map(([key, label]) => (
              <button
                className={`px-3.5 py-2 font-label-caps-sm text-[11px] uppercase tracking-wider transition-colors ${
                  filter === key
                    ? 'bg-on-surface text-surface font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
                key={key}
                onClick={() => setFilter(key)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="bg-on-surface text-surface hover:bg-primary-fixed px-5 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest font-bold transition-colors disabled:opacity-50"
              disabled={busyAction === 'move-all' || items.length === 0}
              onClick={() => void handleMoveAllToBag()}
              type="button"
            >
              {busyAction === 'move-all'
                ? 'TRANSFERRING...'
                : 'MOVE ALL IN-STOCK TO BAG'}
            </button>
            <button
              className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-4 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors disabled:opacity-50"
              disabled={busyAction === 'clear-unavailable'}
              onClick={() => void handleClearUnavailable()}
              type="button"
            >
              CLEAR UNAVAILABLE
            </button>
          </div>
        </div>

        {/* Saved Archive Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-surface-container-low p-12 text-center space-y-4">
            <p className="font-data-mono text-sm text-on-surface-variant uppercase">
              NO ARCHIVE PIECES MATCH THIS STOCK FILTER.
            </p>
            <Link
              className="inline-block bg-on-surface text-surface px-6 py-3 font-label-caps-sm text-xs uppercase tracking-widest font-bold"
              href="/shop"
            >
              EXPLORE CATALOG
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map((entry) => {
              const p = entry.product;
              const stockTone =
                entry.stockState === 'PRE_ORDER'
                  ? 'bg-surface-container-highest text-primary-fixed'
                  : entry.stockState === 'LOW_STOCK'
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-surface-container-highest text-on-surface';

              return (
                <article
                  className="bg-surface-container-low flex flex-col justify-between group"
                  key={entry.id}
                >
                  <div>
                    <Link
                      className="block relative aspect-[3/4] bg-surface-container overflow-hidden"
                      href={`/products/${p.slug}`}
                    >
                      <Image
                        alt={p.name}
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        src={p.images[0]}
                      />
                      <span
                        className={`absolute top-3 left-3 px-2 py-1 font-data-mono text-[10px] uppercase tracking-wider ${stockTone}`}
                      >
                        {entry.stockState.replace('_', ' ')}
                      </span>
                    </Link>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between font-data-mono text-[10px] text-outline uppercase">
                        <span>{p.seriesCode}</span>
                        <span>
                          {entry.selectedSize} {'//'} {entry.selectedColor}
                        </span>
                      </div>
                      <Link
                        className="block font-headline-md text-sm uppercase tracking-tight hover:text-primary-fixed transition-colors"
                        href={`/products/${p.slug}`}
                      >
                        {p.name}
                      </Link>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-data-mono text-sm text-on-surface">
                          {formatPrice(p.priceUsd)}
                        </span>
                        <span className="font-data-mono text-[10px] text-outline">
                          {p.totalStock} UNITS GLOBAL
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex gap-2">
                    <button
                      className="flex-1 bg-on-surface text-surface hover:bg-primary-fixed py-2.5 font-label-caps-sm text-[11px] uppercase tracking-wider font-bold transition-colors disabled:opacity-50"
                      disabled={
                        busyAction === `bag-${p.id}` ||
                        entry.stockState === 'PRE_ORDER'
                      }
                      onClick={() =>
                        void handleAddSingleToBag(
                          p.id,
                          entry.selectedSize,
                          entry.selectedColor,
                          p.name,
                        )
                      }
                      type="button"
                    >
                      {entry.stockState === 'PRE_ORDER'
                        ? 'WAITLIST ONLY'
                        : 'ADD TO BAG'}
                    </button>
                    <button
                      aria-label={`Remove ${p.name} from wishlist`}
                      className="bg-surface-container-high hover:bg-error-container hover:text-on-error-container px-3 py-2.5 text-on-surface-variant transition-colors"
                      disabled={busyAction === entry.id}
                      onClick={() => void handleRemoveItem(entry.id, p.name)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Share Archive Dossier Dialog */}
      <ModalDialog
        maxWidthClass="max-w-lg"
        onClose={() => setShareOpen(false)}
        open={shareOpen}
        titleId="share-archive-title"
      >
        <div className="p-6 md:p-8 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-data-mono text-[10px] text-outline uppercase tracking-widest">
                CURATED CLIENT EXPORT
              </p>
              <h2
                className="font-headline-md text-headline-md uppercase mt-1"
                id="share-archive-title"
              >
                SHARE ARCHIVE DOSSIER
              </h2>
            </div>
            <button
              aria-label="Close share dialog"
              onClick={() => setShareOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Copy this private curation URL to share your saved garments with a
            VERSSARO styling liaison or private collector group.
          </p>

          <div className="bg-surface-container-highest p-3 font-data-mono text-xs break-all select-all">
            {shareManifestUrl}
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 bg-on-surface text-surface py-3 font-label-caps-sm text-xs uppercase tracking-widest font-bold hover:bg-primary-fixed transition-colors"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  void navigator.clipboard.writeText(shareManifestUrl);
                }
                announce('CURATED WISHLIST LINK COPIED TO CLIPBOARD');
                setShareOpen(false);
              }}
              type="button"
            >
              COPY DOSSIER LINK
            </button>
            <button
              className="bg-surface-container-high px-5 py-3 font-label-caps-sm text-xs uppercase tracking-widest"
              onClick={() => setShareOpen(false)}
              type="button"
            >
              CLOSE
            </button>
          </div>
        </div>
      </ModalDialog>
    </StorefrontShell>
  );
}
