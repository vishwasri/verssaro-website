'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StorefrontShell } from '@/components/StorefrontShell';
import { useStore } from '@/components/StoreContext';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { Address, Order } from '@/lib/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, dossier, refreshCart, formatPrice, announce } = useStore();

  const [shippingMethod, setShippingMethod] = useState<
    'colombo_same_day' | 'dhl_express'
  >('colombo_same_day');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'klarna' | 'cod'>(
    'card',
  );
  const [billingSame, setBillingSame] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [touchedSubmit, setTouchedSubmit] = useState(false);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);

  const [email, setEmail] = useState('alexander.wright@verssaro.vip');
  const [phone, setPhone] = useState('+94 77 112 3456');
  const [firstName, setFirstName] = useState('Alexander');
  const [lastName, setLastName] = useState('Wright');
  const [country, setCountry] = useState('Sri Lanka');
  const [addressLine1, setAddressLine1] = useState(
    'Penthouse Residencies 89, Ward Place',
  );
  const [addressLine2, setAddressLine2] = useState('Suite 14B, Cinnamon Gardens');
  const [city, setCity] = useState('Colombo');
  const [province, setProvince] = useState('Western Province');
  const [postalCode, setPostalCode] = useState('00300');

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

  useEffect(() => {
    apiFetch<{ addresses: Address[] }>('/addresses')
      .then((res) => {
        setSavedAddresses(res.addresses);
        const def =
          res.addresses.find((a) => a.isDefault) ?? res.addresses[0];
        if (def) {
          const parts = def.recipientName.split(' ');
          setFirstName(parts[0] || 'Alexander');
          setLastName(parts.slice(1).join(' ') || 'Wright');
          setAddressLine1(def.addressLine1);
          setAddressLine2(def.addressLine2 || '');
          setCity(def.city);
          setProvince(def.province || '');
          setPostalCode(def.postalCode);
          setCountry(def.country);
          setPhone(def.phone);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!dossier?.email) return;
    queueMicrotask(() => setEmail(dossier.email));
  }, [dossier]);

  const applySavedAddress = (addr: Address) => {
    const parts = addr.recipientName.split(' ');
    setFirstName(parts[0] || 'Alexander');
    setLastName(parts.slice(1).join(' ') || 'Wright');
    setAddressLine1(addr.addressLine1);
    setAddressLine2(addr.addressLine2 || '');
    setCity(addr.city);
    setProvince(addr.province || '');
    setPostalCode(addr.postalCode);
    setCountry(addr.country);
    setPhone(addr.phone);
    announce(`LOADED COORDINATES: ${addr.label}`);
  };

  const shippingFeeUsd =
    shippingMethod === 'colombo_same_day' || cart?.freeShipQualified ? 0 : 25;
  const computedTotalUsd = cart
    ? Math.max(0, cart.subtotalUsd - cart.discountUsd + shippingFeeUsd)
    : 0;

  const handleCheckoutSubmit = async (
    e: React.FormEvent,
    overrideMethod?: 'card' | 'klarna' | 'cod',
  ) => {
    e.preventDefault();
    setTouchedSubmit(true);
    setErrorSummary(null);

    if (!cart || cart.items.length === 0) {
      setErrorSummary('Your archive bag is empty. Add garments before checkout.');
      return;
    }

    if (
      !email.trim() ||
      !firstName.trim() ||
      !lastName.trim() ||
      !addressLine1.trim() ||
      !city.trim() ||
      !postalCode.trim()
    ) {
      setErrorSummary(
        'Complete all required contact and shipping destination fields.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiFetch<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          province: province.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
          countryCode: country.toLowerCase().includes('united kingdom')
            ? 'GB'
            : country.toLowerCase().includes('united arab')
              ? 'AE'
              : 'LK',
          shippingMethod,
          paymentMethod: overrideMethod ?? paymentMethod,
          giftMessage: cart.giftMessage,
        }),
      });
      await refreshCart();
      announce(`ORDER ${created.orderNumber} AUTHORIZED`);
      router.push(
        `/checkout/confirmation?order=${encodeURIComponent(created.orderNumber)}`,
      );
    } catch (err: unknown) {
      setErrorSummary(getErrorMessage(err, 'Unable to authorize transaction.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StorefrontShell>
      <main className="w-full pt-26 bg-surface min-h-screen">
        {/* Stepper Header */}
        <section className="bg-surface-container-lowest px-margin-mobile md:px-margin py-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="font-data-mono text-[11px] text-outline uppercase tracking-widest">
                ENCRYPTED CHECKOUT PIPELINE // TLS 1.3
              </span>
              <h1 className="font-headline-lg text-headline-lg uppercase mt-1">
                SOVEREIGN SETTLEMENT
              </h1>
            </div>
            <ol className="flex flex-wrap items-center gap-3 font-data-mono text-[11px] uppercase">
              <li className="text-outline">
                <Link className="hover:text-on-surface" href="/bag">
                  01 BAG
                </Link>
              </li>
              <span className="text-outline-variant">/</span>
              <li className="text-on-surface font-bold">
                02 SHIPPING &amp; DELIVERY
              </li>
              <span className="text-outline-variant">/</span>
              <li className="text-on-surface font-bold">03 PAYMENT</li>
              <span className="text-outline-variant">/</span>
              <li className="text-outline">04 CONFIRMATION</li>
            </ol>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left 7 Cols: Express + Contact + Shipping + Payment Form */}
          <form
            className="lg:col-span-7 space-y-8"
            noValidate
            onSubmit={(e) => void handleCheckoutSubmit(e)}
          >
            {/* Single Accessible Polite Validation Status Region */}
            {errorSummary ? (
              <div
                aria-live="polite"
                className="bg-error-container text-on-error-container p-4 font-data-mono text-data-mono uppercase flex items-center gap-2"
                role="status"
              >
                <span className="material-symbols-outlined text-base">
                  error
                </span>
                <span>{errorSummary}</span>
              </div>
            ) : null}

            {/* Express 1-Click Row */}
            <div className="bg-surface-container-low p-6 space-y-3">
              <span className="font-label-caps-sm text-[10px] text-outline uppercase tracking-widest">
                EXPRESS DIGITAL SETTLEMENT
              </span>
              <div className="grid grid-cols-3 gap-3">
                {(['APPLE PAY', 'G PAY', 'SHOP PAY'] as const).map((wallet) => (
                  <button
                    className="bg-surface-container-lowest hover:bg-on-surface text-on-surface hover:text-surface py-3 font-label-caps-sm text-[11px] uppercase font-bold transition-colors"
                    disabled={submitting}
                    key={wallet}
                    onClick={(e) => void handleCheckoutSubmit(e, 'card')}
                    type="button"
                  >
                    {wallet}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 01: Contact Registry */}
            <section className="bg-surface-container-low p-6 space-y-4">
              <h2 className="font-headline-sm text-headline-sm uppercase">
                01 // CONTACT REGISTRY
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    className="block font-label-caps-sm text-[10px] text-outline uppercase"
                    htmlFor="checkout-email"
                  >
                    EMAIL ADDRESS *
                  </label>
                  <input
                    aria-invalid={touchedSubmit && !email.trim()}
                    autoComplete="email"
                    className="w-full bg-surface-container-lowest px-3.5 py-3 font-body-sm text-on-surface focus:outline-none"
                    id="checkout-email"
                    name="email"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    type="email"
                    value={email}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    className="block font-label-caps-sm text-[10px] text-outline uppercase"
                    htmlFor="checkout-phone"
                  >
                    SMS / WHATSAPP LIAISON *
                  </label>
                  <input
                    autoComplete="tel"
                    className="w-full bg-surface-container-lowest px-3.5 py-3 font-data-mono text-data-mono text-on-surface focus:outline-none"
                    id="checkout-phone"
                    name="phone"
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    type="tel"
                    value={phone}
                  />
                </div>
              </div>
            </section>

            {/* Section 02: Consignee Shipping Coordinates */}
            <section className="bg-surface-container-low p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-headline-sm text-headline-sm uppercase">
                  02 // CONSIGNEE DESTINATION
                </h2>
                {savedAddresses.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {savedAddresses.slice(0, 2).map((addr) => (
                      <button
                        className="bg-surface-container-high hover:bg-on-surface text-on-surface hover:text-surface px-2.5 py-1 font-data-mono text-[10px] uppercase transition-colors"
                        key={addr.id}
                        onClick={() => applySavedAddress(addr)}
                        type="button"
                      >
                        USE {addr.city.toUpperCase()}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    className="block font-label-caps-sm text-[10px] text-outline uppercase"
                    htmlFor="shipping-country"
                  >
                    DESTINATION COUNTRY / REGION
                  </label>
                  <input
                    autoComplete="shipping country-name"
                    className="w-full bg-surface-container-lowest px-3.5 py-3 font-body-sm text-on-surface focus:outline-none"
                    id="shipping-country"
                    name="country"
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    type="text"
                    value={country}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      className="block font-label-caps-sm text-[10px] text-outline uppercase"
                      htmlFor="shipping-first-name"
                    >
                      FIRST NAME *
                    </label>
                    <input
                      autoComplete="shipping given-name"
                      className="w-full bg-surface-container-lowest px-3.5 py-3 font-body-sm text-on-surface focus:outline-none"
                      id="shipping-first-name"
                      name="firstName"
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      type="text"
                      value={firstName}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      className="block font-label-caps-sm text-[10px] text-outline uppercase"
                      htmlFor="shipping-last-name"
                    >
                      LAST NAME *
                    </label>
                    <input
                      autoComplete="shipping family-name"
                      className="w-full bg-surface-container-lowest px-3.5 py-3 font-body-sm text-on-surface focus:outline-none"
                      id="shipping-last-name"
                      name="lastName"
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      type="text"
                      value={lastName}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    className="block font-label-caps-sm text-[10px] text-outline uppercase"
                    htmlFor="shipping-address1"
                  >
                    STREET ADDRESS / BUILDING *
                  </label>
                  <input
                    autoComplete="shipping address-line1"
                    className="w-full bg-surface-container-lowest px-3.5 py-3 font-body-sm text-on-surface focus:outline-none"
                    id="shipping-address1"
                    name="addressLine1"
                    onChange={(e) => setAddressLine1(e.target.value)}
                    required
                    type="text"
                    value={addressLine1}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className="block font-label-caps-sm text-[10px] text-outline uppercase"
                    htmlFor="shipping-address2"
                  >
                    APARTMENT, SUITE, RESIDENCE (OPTIONAL)
                  </label>
                  <input
                    autoComplete="shipping address-line2"
                    className="w-full bg-surface-container-lowest px-3.5 py-3 font-body-sm text-on-surface focus:outline-none"
                    id="shipping-address2"
                    name="addressLine2"
                    onChange={(e) => setAddressLine2(e.target.value)}
                    type="text"
                    value={addressLine2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label
                      className="block font-label-caps-sm text-[10px] text-outline uppercase"
                      htmlFor="shipping-city"
                    >
                      CITY *
                    </label>
                    <input
                      autoComplete="shipping address-level2"
                      className="w-full bg-surface-container-lowest px-3.5 py-3 font-body-sm text-on-surface focus:outline-none"
                      id="shipping-city"
                      name="city"
                      onChange={(e) => setCity(e.target.value)}
                      required
                      type="text"
                      value={city}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      className="block font-label-caps-sm text-[10px] text-outline uppercase"
                      htmlFor="shipping-province"
                    >
                      PROVINCE / STATE
                    </label>
                    <input
                      autoComplete="shipping address-level1"
                      className="w-full bg-surface-container-lowest px-3.5 py-3 font-body-sm text-on-surface focus:outline-none"
                      id="shipping-province"
                      name="province"
                      onChange={(e) => setProvince(e.target.value)}
                      type="text"
                      value={province}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      className="block font-label-caps-sm text-[10px] text-outline uppercase"
                      htmlFor="shipping-postal"
                    >
                      POSTAL CODE *
                    </label>
                    <input
                      autoComplete="shipping postal-code"
                      className="w-full bg-surface-container-lowest px-3.5 py-3 font-data-mono text-data-mono text-on-surface focus:outline-none"
                      id="shipping-postal"
                      name="postalCode"
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                      type="text"
                      value={postalCode}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 03: Logistics Protocol */}
            <section className="bg-surface-container-low p-6 space-y-4">
              <h2 className="font-headline-sm text-headline-sm uppercase">
                03 // LOGISTICS PROTOCOL
              </h2>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 bg-surface-container-lowest cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      checked={shippingMethod === 'colombo_same_day'}
                      name="shippingMethod"
                      onChange={() => setShippingMethod('colombo_same_day')}
                      type="radio"
                      value="colombo_same_day"
                    />
                    <div>
                      <div className="font-label-caps-lg text-label-caps-lg uppercase">
                        COLOMBO ATELIER SAME-DAY COURIER
                      </div>
                      <div className="font-data-mono text-[11px] text-outline">
                        White-glove armored courier dispatch within 3 hours
                      </div>
                    </div>
                  </div>
                  <span className="font-data-mono text-data-mono font-bold text-emerald-400">
                    COMPLIMENTARY
                  </span>
                </label>

                <label className="flex items-center justify-between p-4 bg-surface-container-lowest cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      checked={shippingMethod === 'dhl_express'}
                      name="shippingMethod"
                      onChange={() => setShippingMethod('dhl_express')}
                      type="radio"
                      value="dhl_express"
                    />
                    <div>
                      <div className="font-label-caps-lg text-label-caps-lg uppercase">
                        DHL EXPRESS PRIORITY GLOBAL DDP
                      </div>
                      <div className="font-data-mono text-[11px] text-outline">
                        2–3 business days worldwide · Duties Included
                      </div>
                    </div>
                  </div>
                  <span className="font-data-mono text-data-mono font-bold text-on-surface">
                    {cart?.freeShipQualified ? 'COMPLIMENTARY' : formatPrice(25)}
                  </span>
                </label>
              </div>
            </section>

            {/* Section 04: Encrypted Settlement (following autofill-payment-form rules) */}
            <section className="bg-surface-container-low p-6 space-y-5">
              <h2 className="font-headline-sm text-headline-sm uppercase">
                04 // ENCRYPTED SETTLEMENT
              </h2>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: 'card', label: 'CREDIT / DEBIT CARD' },
                    { id: 'klarna', label: 'KLARNA 4X' },
                    { id: 'cod', label: 'CONCIERGE COD' },
                  ] as const
                ).map((pm) => (
                  <button
                    className={`px-4 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-wider ${
                      paymentMethod === pm.id
                        ? 'bg-on-surface text-surface font-bold'
                        : 'bg-surface-container-lowest text-on-surface-variant'
                    }`}
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    type="button"
                  >
                    {pm.label}
                  </button>
                ))}
              </div>

              {paymentMethod === 'card' ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      className="block font-label-caps-sm text-[10px] text-outline uppercase"
                      htmlFor="cc-name"
                    >
                      CARDHOLDER NAME
                    </label>
                    <input
                      autoComplete="cc-name"
                      className="w-full bg-surface-container-lowest px-3.5 py-3 font-body-sm text-on-surface focus:outline-none"
                      defaultValue="ALEXANDER WRIGHT"
                      id="cc-name"
                      name="ccName"
                      type="text"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="block font-label-caps-sm text-[10px] text-outline uppercase"
                      htmlFor="cc-number"
                    >
                      CARD NUMBER
                    </label>
                    <span
                      className="block font-data-mono text-[10px] text-outline"
                      id="cc-number-hint"
                    >
                      16 digits without dashes or spaces for test preview
                    </span>
                    <input
                      aria-describedby="cc-number-hint"
                      autoComplete="cc-number"
                      className="w-full bg-surface-container-lowest px-3.5 py-3 font-data-mono text-data-mono text-on-surface focus:outline-none"
                      defaultValue="4242 4242 4242 4242"
                      id="cc-number"
                      inputMode="numeric"
                      name="cardNumber"
                      type="text"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        className="block font-label-caps-sm text-[10px] text-outline uppercase"
                        htmlFor="cc-exp"
                      >
                        EXPIRATION DATE
                      </label>
                      <span
                        className="block font-data-mono text-[10px] text-outline"
                        id="cc-exp-hint"
                      >
                        Format: MM/YY
                      </span>
                      <input
                        aria-describedby="cc-exp-hint"
                        autoComplete="cc-exp"
                        className="w-full bg-surface-container-lowest px-3.5 py-3 font-data-mono text-data-mono text-on-surface focus:outline-none"
                        defaultValue="09/28"
                        id="cc-exp"
                        inputMode="numeric"
                        name="cardExp"
                        type="text"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        className="block font-label-caps-sm text-[10px] text-outline uppercase"
                        htmlFor="cc-csc"
                      >
                        SECURITY CODE (CVC)
                      </label>
                      <span
                        className="block font-data-mono text-[10px] text-outline"
                        id="cc-csc-hint"
                      >
                        3 or 4 numeric digits
                      </span>
                      <input
                        aria-describedby="cc-csc-hint"
                        autoComplete="cc-csc"
                        className="w-full bg-surface-container-lowest px-3.5 py-3 font-data-mono text-data-mono text-on-surface focus:outline-none"
                        defaultValue="842"
                        id="cc-csc"
                        inputMode="numeric"
                        maxLength={4}
                        name="cardCvc"
                        type="text"
                      />
                    </div>
                  </div>
                </div>
              ) : paymentMethod === 'klarna' ? (
                <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-lowest p-4">
                  Split settlement into 4 zero-interest installments of{' '}
                  <strong className="text-on-surface">
                    {formatPrice(computedTotalUsd / 4)}
                  </strong>
                  .
                </p>
              ) : (
                <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-lowest p-4">
                  Colombo White-Glove armored terminal accepts POS card or cash
                  upon physical garment inspection and NFC handshake.
                </p>
              )}

              <label className="flex items-center gap-2.5 pt-2 cursor-pointer font-body-sm text-body-sm text-on-surface-variant">
                <input
                  checked={billingSame}
                  className="accent-primary"
                  onChange={(e) => setBillingSame(e.target.checked)}
                  type="checkbox"
                />
                <span>Billing address identical to shipping destination</span>
              </label>

              <button
                className="w-full bg-on-surface hover:bg-primary-fixed text-surface py-4 font-label-caps-lg text-label-caps-lg uppercase tracking-widest font-bold transition-colors disabled:opacity-50"
                disabled={submitting}
                type="submit"
              >
                {submitting
                  ? 'AUTHORIZING ARCHIVE ALLOCATION...'
                  : `AUTHORIZE & COMPLETE ORDER — ${formatPrice(computedTotalUsd, true)}`}
              </button>
            </section>
          </form>

          {/* Right 5 Cols: Sticky Manifest Summary */}
          <aside className="lg:col-span-5 lg:sticky lg:top-28 bg-surface-container-low p-6 space-y-5">
            <h2 className="font-headline-sm text-headline-sm uppercase">
              MANIFEST SUMMARY ({cart?.itemCount ?? 0} PIECES)
            </h2>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {cart?.items.map((item) => (
                <div
                  className="flex items-center gap-4 bg-surface-container-lowest p-3"
                  key={item.id}
                >
                  <img
                    alt={item.name}
                    className="w-16 h-20 object-cover bg-surface-container-high shrink-0"
                    src={item.imageUrl}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-label-caps-sm text-[11px] uppercase truncate text-on-surface">
                      {item.name}
                    </div>
                    <div className="font-data-mono text-[10px] text-outline uppercase">
                      {item.size} · {item.colorName} · QTY {item.quantity}
                    </div>
                  </div>
                  <div className="font-data-mono text-data-mono font-bold text-on-surface shrink-0">
                    {formatPrice(item.lineTotalUsd)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-3 bg-surface-container-lowest p-4 font-data-mono text-data-mono">
              <div className="flex justify-between text-on-surface-variant">
                <span>SUBTOTAL</span>
                <span>{formatPrice(cart?.subtotalUsd ?? 0)}</span>
              </div>
              {cart?.appliedPromo ? (
                <div className="flex justify-between text-emerald-400">
                  <span>DISCOUNT ({cart.appliedPromo.code})</span>
                  <span>-{formatPrice(cart.discountUsd)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-on-surface-variant">
                <span>LOGISTICS DISPATCH</span>
                <span>
                  {shippingFeeUsd === 0
                    ? 'COMPLIMENTARY'
                    : formatPrice(shippingFeeUsd)}
                </span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>ESTIMATED DUTIES (DDP)</span>
                <span>INCLUDED</span>
              </div>
              <div className="pt-3 flex justify-between text-on-surface font-bold text-body-lg">
                <span>TOTAL DUE</span>
                <span>{formatPrice(computedTotalUsd, true)}</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </StorefrontShell>
  );
}
