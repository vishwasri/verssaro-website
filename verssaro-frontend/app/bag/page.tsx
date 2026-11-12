'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { StorefrontShell } from '@/components/StorefrontShell';
import { useStore } from '@/components/StoreContext';
import { getErrorMessage } from '@/lib/api';

export default function ShoppingBagPage() {
  const {
    cart,
    updateCartQty,
    removeCartItem,
    applyPromoCode,
    updateCartMeta,
    toggleWishlist,
    formatPrice,
    announce,
  } = useStore();

  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [countdownSec, setCountdownSec] = useState(14 * 60 + 59);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = String(Math.floor(countdownSec / 60)).padStart(2, '0');
  const secs = String(countdownSec % 60).padStart(2, '0');

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    try {
      await applyPromoCode(promoInput.trim());
      setPromoInput('');
    } catch (err: unknown) {
      setPromoError(getErrorMessage(err, 'INVALID PROMO CODE'));
    }
  };

  const handleSaveForLater = async (item: {
    id: string;
    productId: string;
    size: string;
    colorName: string;
  }) => {
    await toggleWishlist({
      productId: item.productId,
      selectedSize: item.size,
      selectedColor: item.colorName,
    });
    await removeCartItem(item.id);
    announce('MOVED PIECE TO SAVED ARCHIVE WISHLIST');
  };

  const progressPercent = cart
    ? Math.min(
        100,
        Math.round(
          (cart.subtotalUsd / Math.max(1, cart.freeShippingThresholdUsd)) * 100,
        ),
      )
    : 0;

  return (
    <StorefrontShell>
      <main className="w-full pt-26 bg-surface min-h-screen">
        {/* Session Reservation + Threshold Banner */}
        <section className="bg-surface-container-lowest px-margin-mobile md:px-margin py-6">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <span className="font-data-mono text-[11px] text-outline uppercase tracking-widest">
                  01 // ARCHIVE ALLOCATION SESSION
                </span>
                <h1 className="font-headline-lg text-headline-lg uppercase text-on-surface">
                  YOUR SHOPPING BAG ({cart?.itemCount ?? 0})
                </h1>
              </div>

              <div className="bg-surface-container-low px-4 py-2 font-data-mono text-data-mono uppercase flex items-center gap-2 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <span className="text-outline">INVENTORY RESERVED:</span>
                <span className="text-on-surface font-bold">
                  {mins}:{secs}
                </span>
              </div>
            </div>

            {/* Free Global DHL Threshold Meter */}
            {cart ? (
              <div className="bg-surface-container-low p-4 space-y-2">
                <div className="flex items-center justify-between font-data-mono text-[11px] uppercase">
                  <span>
                    {cart.freeShipQualified
                      ? 'QUALIFIED FOR COMPLIMENTARY GLOBAL DHL EXPRESS PRIORITY'
                      : `YOU ARE ${formatPrice(cart.amountToFreeShippingUsd)} AWAY FROM COMPLIMENTARY GLOBAL DHL EXPRESS`}
                  </span>
                  <span className="text-outline">
                    THRESHOLD: {formatPrice(cart.freeShippingThresholdUsd, true)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-lowest overflow-hidden">
                  <div
                    className="h-full bg-on-surface transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Main Split Layout: Line Items (8 cols) vs Sticky Order Summary (4 cols) */}
        <section className="max-w-7xl mx-auto px-margin-mobile md:px-margin py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left 8 Columns: Cart Items + Packaging */}
          <div className="lg:col-span-8 space-y-6">
            {!cart || cart.items.length === 0 ? (
              <div className="bg-surface-container-low p-12 text-center space-y-5">
                <span className="material-symbols-outlined text-4xl text-outline">
                  shopping_bag
                </span>
                <h2 className="font-headline-sm text-headline-sm uppercase">
                  YOUR ARCHIVE BAG IS EMPTY
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Explore Archive 01 Heavyweight Tees, 520 GSM French Terry, and
                  Technical Outerwear.
                </p>
                <Link
                  className="inline-block bg-on-surface text-surface px-8 py-4 font-label-caps-lg uppercase font-bold"
                  href="/shop"
                >
                  EXPLORE COLLECTION
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <article
                    className="bg-surface-container-low p-5 flex flex-col sm:grid sm:grid-cols-12 gap-5 items-center hover:bg-surface-container transition-colors"
                    key={item.id}
                  >
                    <div className="w-full sm:col-span-6 flex items-start gap-4 min-w-0">
                      <Link
                        className="relative w-24 h-32 shrink-0 bg-surface-container-highest overflow-hidden"
                        href={`/products/${item.slug}`}
                      >
                        <img
                          alt={item.name}
                          className="w-full h-full object-cover"
                          src={item.imageUrl}
                        />
                        {item.badge ? (
                          <span className="absolute top-1 left-1 bg-on-surface text-surface font-data-mono text-[9px] px-1 uppercase font-bold">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                      <div className="min-w-0 flex flex-col gap-1">
                        <span className="font-data-mono text-[10px] text-outline uppercase">
                          SKU: {item.sku}
                        </span>
                        <Link
                          className="font-label-caps-lg text-label-caps-lg uppercase text-on-surface hover:text-primary truncate"
                          href={`/products/${item.slug}`}
                        >
                          {item.name}
                        </Link>
                        <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                          <span>
                            Size: <strong className="text-on-surface">{item.size}</strong>
                          </span>
                          <span className="text-outline">/</span>
                          <span>
                            Color:{' '}
                            <strong className="text-on-surface">
                              {item.colorName}
                            </strong>
                          </span>
                        </div>
                        <span className="font-data-mono text-[10px] text-emerald-400 uppercase mt-1">
                          ● IN STOCK — {item.stockRemaining} REMAINING
                        </span>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="w-full sm:col-span-3 flex sm:flex-col items-center justify-between sm:justify-center gap-2">
                      <div className="flex items-center bg-surface-container-lowest">
                        <button
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-high"
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            void updateCartQty(item.id, item.quantity - 1)
                          }
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm">
                            remove
                          </span>
                        </button>
                        <span className="w-10 text-center font-data-mono text-data-mono">
                          {item.quantity}
                        </span>
                        <button
                          aria-label={`Increase quantity of ${item.name}`}
                          className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-high"
                          disabled={item.quantity >= 10}
                          onClick={() =>
                            void updateCartQty(item.id, item.quantity + 1)
                          }
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm">
                            add
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 font-label-caps-sm text-[10px] uppercase">
                        <button
                          className="text-outline hover:text-on-surface"
                          onClick={() => void handleSaveForLater(item)}
                          type="button"
                        >
                          SAVE LATER
                        </button>
                        <span className="text-outline-variant">·</span>
                        <button
                          className="text-tertiary hover:text-on-surface"
                          onClick={() => void removeCartItem(item.id)}
                          type="button"
                        >
                          REMOVE
                        </button>
                      </div>
                    </div>

                    {/* Row Line Total */}
                    <div className="w-full sm:col-span-3 flex sm:flex-col items-center justify-between sm:items-end">
                      <span className="sm:hidden font-data-mono text-data-mono text-outline uppercase">
                        LINE TOTAL
                      </span>
                      <span className="font-data-mono text-body-lg font-bold text-on-surface">
                        {formatPrice(item.lineTotalUsd, true)}
                      </span>
                      <span className="font-data-mono text-[10px] text-outline hidden sm:block">
                        {formatPrice(item.unitPriceUsd)} each
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Complimentary Luxury Collector Packaging */}
            <div className="bg-surface-container-low p-6 space-y-4">
              <div className="flex items-start gap-3">
                <input
                  checked={cart?.collectorBox ?? true}
                  className="mt-1 w-4 h-4 accent-primary cursor-pointer"
                  id="bag-collector-box"
                  onChange={(e) =>
                    void updateCartMeta({ collectorBox: e.target.checked })
                  }
                  type="checkbox"
                />
                <div className="flex-1">
                  <label
                    className="font-label-caps-lg text-label-caps-lg uppercase text-on-surface cursor-pointer"
                    htmlFor="bag-collector-box"
                  >
                    VERSSARO Bespoke Matte Black Collector Box &amp; Embossed
                    Dust Bag
                  </label>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Complimentary signature unboxing suite including heavy
                    unbleached cotton preservation folio and wax-stamped
                    authentication seal.
                  </p>
                </div>
                <span className="font-data-mono text-[10px] bg-surface-container-lowest px-2 py-1 uppercase text-primary-fixed">
                  FREE
                </span>
              </div>

              <div className="space-y-1.5">
                <label
                  className="block font-label-caps-sm text-[10px] text-outline uppercase tracking-wider"
                  htmlFor="bag-gift-message"
                >
                  BESPOKE CALLIGRAPHY CARD MESSAGE (MAX 220 CHARS)
                </label>
                <textarea
                  className="w-full bg-surface-container-lowest p-3 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none"
                  defaultValue={cart?.giftMessage || ''}
                  id="bag-gift-message"
                  maxLength={220}
                  onBlur={(e) =>
                    void updateCartMeta({ giftMessage: e.target.value })
                  }
                  placeholder="Compose personalized archival note..."
                  rows={2}
                />
              </div>
            </div>

            {/* Service Assurance Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container-lowest p-5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-fixed">
                  verified
                </span>
                <div>
                  <div className="font-label-caps-sm text-[10px] uppercase">
                    GUARANTEED AUTHENTIC
                  </div>
                  <div className="font-data-mono text-[10px] text-outline">
                    Direct from Colombo Atelier
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-fixed">
                  sync
                </span>
                <div>
                  <div className="font-label-caps-sm text-[10px] uppercase">
                    30-DAY GLOBAL RETURNS
                  </div>
                  <div className="font-data-mono text-[10px] text-outline">
                    Complimentary DHL Pickups
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-fixed">
                  security
                </span>
                <div>
                  <div className="font-label-caps-sm text-[10px] uppercase">
                    256-BIT ENCRYPTED
                  </div>
                  <div className="font-data-mono text-[10px] text-outline">
                    PCI-DSS Tier 1 Settlement
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right 4 Columns: Sticky Order Summary */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28 space-y-5">
            <div className="bg-surface-container-low p-6 space-y-5 shadow-xl">
              <div className="bg-surface-container-lowest -mx-6 -mt-6 p-6 flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm uppercase">
                  ORDER SUMMARY
                </h2>
                <span className="font-data-mono text-[11px] text-outline">
                  LIVE ESTIMATE
                </span>
              </div>

              <div className="space-y-3 font-body-sm text-body-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Garment Subtotal</span>
                  <span className="font-data-mono text-on-surface">
                    {formatPrice(cart?.subtotalUsd ?? 0)}
                  </span>
                </div>

                {cart?.appliedPromo ? (
                  <div className="flex justify-between items-center text-emerald-400 font-data-mono text-[12px]">
                    <span className="flex items-center gap-1.5">
                      <span>PROMO ({cart.appliedPromo.code})</span>
                      <button
                        aria-label="Remove promo code"
                        className="text-outline hover:text-tertiary underline text-[10px]"
                        onClick={() => void applyPromoCode('')}
                        type="button"
                      >
                        REMOVE
                      </button>
                    </span>
                    <span>-{formatPrice(cart.discountUsd)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between text-on-surface-variant">
                  <span>Global Shipping</span>
                  <span className="font-data-mono text-on-surface">
                    {cart?.shippingUsd === 0
                      ? 'COMPLIMENTARY'
                      : formatPrice(cart?.shippingUsd ?? 0)}
                  </span>
                </div>

                <div className="pt-3 bg-surface-container-lowest -mx-6 px-6 py-4 flex items-baseline justify-between">
                  <span className="font-label-caps-lg text-label-caps-lg uppercase">
                    ESTIMATED TOTAL
                  </span>
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">
                    {formatPrice(cart?.totalUsd ?? 0, true)}
                  </span>
                </div>
              </div>

              {/* Promo Accordion */}
              <div>
                <button
                  aria-expanded={promoOpen}
                  className="w-full py-2 font-label-caps-sm text-[11px] uppercase tracking-wider text-on-surface-variant hover:text-on-surface flex items-center justify-between"
                  onClick={() => setPromoOpen((v) => !v)}
                  type="button"
                >
                  <span>APPLY ARCHIVE ACCESS / PROMO CODE</span>
                  <span className="material-symbols-outlined text-sm">
                    {promoOpen ? 'remove' : 'add'}
                  </span>
                </button>
                {promoOpen ? (
                  <form
                    className="mt-2 space-y-2"
                    onSubmit={(e) => void handleApplyPromo(e)}
                  >
                    <div className="flex gap-2">
                      <label className="visually-hidden" htmlFor="bag-promo-input">
                        Enter promo code (e.g., ARCHIVE10)
                      </label>
                      <input
                        className="flex-1 bg-surface-container-lowest px-3 py-2 font-data-mono text-data-mono uppercase text-on-surface"
                        id="bag-promo-input"
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="ARCHIVE10 / SOVEREIGN-DROP-02"
                        type="text"
                        value={promoInput}
                      />
                      <button
                        className="bg-surface-container-highest hover:bg-on-surface text-on-surface hover:text-surface px-4 py-2 font-label-caps-sm text-[11px] uppercase font-bold"
                        type="submit"
                      >
                        APPLY
                      </button>
                    </div>
                    {promoError ? (
                      <p className="font-data-mono text-[11px] text-error uppercase">
                        {promoError}
                      </p>
                    ) : null}
                  </form>
                ) : null}
              </div>

              <Link
                className={`block w-full text-center py-4 font-label-caps-lg text-label-caps-lg uppercase tracking-widest font-bold transition-colors ${
                  cart && cart.items.length > 0
                    ? 'bg-on-surface hover:bg-primary-fixed text-surface'
                    : 'bg-surface-container-high text-outline pointer-events-none'
                }`}
                href="/checkout"
              >
                PROCEED TO CHECKOUT
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  className="bg-surface-container-lowest hover:bg-surface-container-high py-3 text-center font-label-caps-sm text-[10px] uppercase tracking-wider"
                  href="/checkout?express=apple"
                >
                  APPLE PAY 1-CLICK
                </Link>
                <Link
                  className="bg-surface-container-lowest hover:bg-surface-container-high py-3 text-center font-label-caps-sm text-[10px] uppercase tracking-wider"
                  href="/checkout?express=gpay"
                >
                  GOOGLE PAY 1-CLICK
                </Link>
              </div>
            </div>
          </aside>
        </section>

        {/* YOU MAY ALSO LIKE Recommendations */}
        {cart && cart.youMayAlsoLike.length > 0 ? (
          <section className="bg-surface-container-lowest py-16 px-margin-mobile md:px-margin">
            <div className="max-w-7xl mx-auto space-y-8">
              <div>
                <span className="font-data-mono text-[11px] text-outline uppercase tracking-widest">
                  COMPLETE THE ARCHIVE UNIFORM
                </span>
                <h2 className="font-headline-md text-headline-md uppercase mt-1">
                  YOU MAY ALSO LIKE
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
                {cart.youMayAlsoLike.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </StorefrontShell>
  );
}
