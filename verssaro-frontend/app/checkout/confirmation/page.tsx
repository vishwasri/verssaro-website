'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { StorefrontShell } from '@/components/StorefrontShell';
import { useStore } from '@/components/StoreContext';
import { apiFetch } from '@/lib/api';
import { Order } from '@/lib/types';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || 'VR-2025-98421-COL';
  const { formatPrice, announce } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadedOrderKey, setLoadedOrderKey] = useState<string | null>(null);
  const loading = loadedOrderKey !== orderNumber;

  useEffect(() => {
    let active = true;
    apiFetch<Order>(`/orders/confirmation/${encodeURIComponent(orderNumber)}`)
      .then((res) => {
        if (active) setOrder(res);
      })
      .catch(() => {
        apiFetch<Order>('/orders/confirmation/VR-2025-98421-COL')
          .then((res) => {
            if (active) setOrder(res);
          })
          .catch(() => {});
      })
      .finally(() => {
        if (active) setLoadedOrderKey(orderNumber);
      });
    return () => {
      active = false;
    };
  }, [orderNumber]);

  const copyTracking = async () => {
    if (!order) return;
    await navigator.clipboard?.writeText(order.orderNumber);
    announce(`COPIED ORDER CODE ${order.orderNumber}`);
  };

  if (loading) {
    return (
      <div className="pt-36 max-w-5xl mx-auto px-margin-mobile py-20">
        <div className="h-96 bg-surface-container-low animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-36 max-w-4xl mx-auto px-margin-mobile text-center py-20 space-y-4">
        <h1 className="font-headline-lg text-headline-lg uppercase">
          ORDER MANIFEST NOT FOUND
        </h1>
        <Link
          className="inline-block bg-on-surface text-surface px-8 py-4 font-label-caps-lg uppercase font-bold"
          href="/account"
        >
          VIEW CLIENT ORDERS
        </Link>
      </div>
    );
  }

  const milestones = [
    '01 CONFIRMED',
    '02 ATELIER QC',
    '03 DISPATCHED',
    '04 DELIVERED',
  ];

  return (
    <main className="w-full pt-26 bg-surface min-h-screen pb-20">
      {/* Confirmation Banner */}
      <section className="bg-surface-container-lowest px-margin-mobile md:px-margin py-12">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 bg-surface-container-high px-3 py-1 font-data-mono text-[11px] uppercase text-emerald-400">
              <span className="material-symbols-outlined text-sm">
                verified
              </span>
              <span>ARCHIVE ALLOCATION CONFIRMED</span>
            </span>
            <h1 className="font-display-xl text-display-xl-mobile md:text-headline-lg uppercase text-on-surface">
              THANK YOU FOR DEFINING YOUR PRESENCE.
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Dossier transmission sent to{' '}
              <strong className="text-on-surface">{order.email}</strong>. Your
              silicon-authenticated garments are staged at Colombo Flagship #01.
            </p>
          </div>

          <div className="bg-surface-container-low p-5 space-y-2 shrink-0">
            <span className="font-data-mono text-[10px] text-outline uppercase">
              ORDER MANIFEST NUMBER
            </span>
            <div className="flex items-center gap-3">
              <span className="font-data-mono text-body-lg font-bold text-on-surface">
                {order.orderNumber}
              </span>
              <button
                className="bg-surface-container-highest hover:bg-on-surface text-on-surface hover:text-surface px-3 py-1 font-data-mono text-[10px] uppercase"
                onClick={() => void copyTracking()}
                type="button"
              >
                COPY
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin pt-10 space-y-8">
        {/* 4-Step Milestone Pipeline */}
        <section className="bg-surface-container-low p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 font-data-mono text-[11px] uppercase">
            <span className="text-on-surface font-bold">
              {order.carrierName}
            </span>
            <span className="text-primary-fixed">
              TRACKING // {order.trackingNumber}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {milestones.map((stepLabel, idx) => {
              const reached = idx + 1 <= order.milestoneStep;
              return (
                <div
                  className={`p-3 font-data-mono text-[11px] uppercase ${
                    reached
                      ? 'bg-on-surface text-surface font-bold'
                      : 'bg-surface-container-lowest text-outline'
                  }`}
                  key={stepLabel}
                >
                  {stepLabel}
                </div>
              );
            })}
          </div>
        </section>

        {/* Destination Dossier & Packaging Manifest */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <div className="bg-surface-container-low p-6 space-y-3">
            <span className="font-data-mono text-[10px] text-outline uppercase tracking-widest">
              DESTINATION COORDINATES // {order.destinationCode}
            </span>
            <h2 className="font-headline-sm text-headline-sm uppercase">
              {order.customerName}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {order.shippingAddress?.addressLine1}
              {order.shippingAddress?.addressLine2
                ? `, ${order.shippingAddress.addressLine2}`
                : ''}
              <br />
              {order.shippingAddress?.city} {order.shippingAddress?.postalCode}
              <br />
              {order.shippingAddress?.country}
            </p>
          </div>

          <div className="bg-surface-container-low p-6 space-y-3">
            <span className="font-data-mono text-[10px] text-outline uppercase tracking-widest">
              PACKAGING &amp; SETTLEMENT LEDGER
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {order.packagingManifest?.collectorBox
                ? '✓ VERSSARO Matte Black Collector Box + Unbleached Preservation Folio'
                : 'Standard Protective Archival Carton'}
            </p>
            {order.packagingManifest?.giftMessage ? (
              <p className="font-data-mono text-[11px] text-primary-fixed bg-surface-container-lowest p-3">
                CALLIGRAPHY NOTE: “{order.packagingManifest.giftMessage}”
              </p>
            ) : null}
            <div className="font-data-mono text-[11px] text-emerald-400 uppercase">
              PAYMENT STATUS: {order.paymentStatus} ({order.paymentMethod.toUpperCase()})
            </div>
          </div>
        </section>

        {/* Acquisition Items + Final Price Breakdown */}
        <section className="bg-surface-container-low p-6 space-y-4">
          <h2 className="font-headline-sm text-headline-sm uppercase">
            ACQUISITION MANIFEST
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                className="flex items-center justify-between gap-4 bg-surface-container-lowest p-4"
                key={item.id}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    alt={item.name}
                    className="w-16 h-20 object-cover bg-surface-container shrink-0"
                    src={item.imageUrl}
                  />
                  <div className="min-w-0">
                    <div className="font-data-mono text-[10px] text-outline">
                      {item.sku}
                    </div>
                    <div className="font-label-caps-lg text-label-caps-lg uppercase truncate">
                      {item.name}
                    </div>
                    <div className="font-data-mono text-[11px] text-on-surface-variant uppercase">
                      SIZE {item.size} {'//'} {item.colorName} {'//'} QTY{' '}
                      {item.quantity}
                    </div>
                  </div>
                </div>
                <span className="font-data-mono text-data-mono font-bold text-on-surface">
                  {formatPrice(item.lineTotal, true)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-surface-container-lowest p-5 space-y-2 font-data-mono text-data-mono">
            <div className="flex justify-between text-on-surface-variant">
              <span>SUBTOTAL</span>
              <span>{formatPrice(order.subtotalUsd)}</span>
            </div>
            {order.discountUsd > 0 ? (
              <div className="flex justify-between text-emerald-400">
                <span>PROMO ({order.promoCodeUsed})</span>
                <span>-{formatPrice(order.discountUsd)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-on-surface-variant">
              <span>SHIPPING</span>
              <span>
                {order.shippingUsd === 0
                  ? 'COMPLIMENTARY'
                  : formatPrice(order.shippingUsd)}
              </span>
            </div>
            <div className="pt-2 flex justify-between text-on-surface font-bold text-body-lg">
              <span>TOTAL SETTLED</span>
              <span>{formatPrice(order.totalUsd, true)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              className="bg-on-surface text-surface px-8 py-4 font-label-caps-lg uppercase font-bold"
              href="/account"
            >
              VIEW ORDER HISTORY
            </Link>
            <button
              className="bg-surface-container-highest text-on-surface px-6 py-4 font-label-caps-lg uppercase"
              onClick={() => window.print()}
              type="button"
            >
              PRINT DOSSIER RECEIPT
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CheckoutConfirmationPage() {
  return (
    <StorefrontShell>
      <Suspense
        fallback={
          <div className="pt-36 text-center font-data-mono uppercase">
            LOADING ORDER CONFIRMATION...
          </div>
        }
      >
        <ConfirmationContent />
      </Suspense>
    </StorefrontShell>
  );
}
