'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DossierHeaderNav } from '@/components/DossierHeaderNav';
import { ModalDialog } from '@/components/ModalDialog';
import { useStore } from '@/components/StoreContext';
import { StorefrontShell } from '@/components/StorefrontShell';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { Order } from '@/lib/types';

const PIPELINE_STEPS = ['CONFIRMED', 'ATELIER QC', 'IN TRANSIT', 'DELIVERED'];

export default function AccountOrdersPage() {
  const { dossier, refreshDossier, formatPrice, announce } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadedForId, setLoadedForId] = useState<string | null>(null);
  const loading = loadedForId === null && orders.length === 0;

  // Edit Profile Modal
  const [editOpen, setEditOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [hubInput, setHubInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security & Keys Modal
  const [keysOpen, setKeysOpen] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch<{ orders: Order[] }>('/orders/my')
      .then((res) => {
        if (active) setOrders(res.orders || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadedForId(dossier?.id || 'default');
      });
    return () => {
      active = false;
    };
  }, [dossier?.id]);

  const openEditModal = () => {
    setNameInput(dossier?.name || 'Alexander Wright');
    setPhoneInput(dossier?.phone || '+94 77 412 8890');
    setHubInput(dossier?.atelierHub || 'COLOMBO FLAGSHIP #01');
    setNotesInput(dossier?.liaisonNotes || '');
    setEditOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiFetch('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: nameInput.trim(),
          phone: phoneInput.trim(),
          atelierHub: hubInput.trim(),
          liaisonNotes: notesInput.trim(),
        }),
      });
      await refreshDossier();
      setEditOpen(false);
      announce('PATRON PROFILE UPDATED');
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'UNABLE TO UPDATE PROFILE'), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin py-10 space-y-8">
        <DossierHeaderNav
          activeTab="orders"
          rightSlot={
            <>
              <button
                className="bg-surface-container-low hover:bg-surface-container text-on-surface px-4 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors"
                onClick={openEditModal}
                type="button"
              >
                EDIT PROFILE
              </button>
              <button
                className="bg-surface-container-low hover:bg-surface-container text-on-surface px-4 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors"
                onClick={() => setKeysOpen(true)}
                type="button"
              >
                SECURITY &amp; KEYS
              </button>
            </>
          }
          subtitle="Track active international DHL air freight telemetry, review archival acquisitions, and manage collector preferences."
          title="CLIENT ARCHIVE // ORDER HISTORY"
        />

        {/* Patron Collector Telemetry Row */}
        <section
          aria-label="Collector Metrics"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-surface-container-low p-5 space-y-2">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              ARCHIVAL ACQUISITIONS
            </span>
            <p className="font-data-mono text-2xl text-primary-fixed">
              {formatPrice(dossier?.totalSpendUsd ?? 4820)}
            </p>
            <p className="font-data-mono text-[10px] text-outline">
              ACROSS {orders.length} LOGGED ORDERS
            </p>
          </div>

          <div className="bg-surface-container-low p-5 space-y-2">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              COLLECTOR RANKING
            </span>
            <p className="font-data-mono text-2xl text-on-surface">
              TOP 1% // TIER 01
            </p>
            <p className="font-data-mono text-[10px] text-primary-fixed">
              24H ADVANCE DROP WINDOW ACTIVE
            </p>
          </div>

          <div className="bg-surface-container-low p-5 space-y-2">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              RESIDUAL STORE CREDIT
            </span>
            <p className="font-data-mono text-2xl text-on-surface">
              {formatPrice(dossier?.storeCreditUsd ?? 350)}
            </p>
            <p className="font-data-mono text-[10px] text-outline">
              APPLICABLE TO CAPSULE RELEASES
            </p>
          </div>

          <div className="bg-surface-container-low p-5 space-y-2">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              PRIMARY HUB &amp; LIAISON
            </span>
            <p className="font-data-mono text-base text-on-surface uppercase truncate">
              {dossier?.atelierHub || 'COLOMBO FLAGSHIP #01'}
            </p>
            <p className="font-data-mono text-[10px] text-outline uppercase">
              {dossier?.liaisonName || 'SARA K.'} {'//'}{' '}
              {dossier?.restorationPassesRemaining ?? 3} CARE PASSES
            </p>
          </div>
        </section>

        {/* Order Stream */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md uppercase">
              ACQUISITION LOGISTICS PIPELINE ({orders.length})
            </h2>
            <span className="font-data-mono text-xs text-outline uppercase">
              REAL-TIME AIR FREIGHT TELEMETRY
            </span>
          </div>

          {loading ? (
            <div className="bg-surface-container-low p-10 font-data-mono text-xs uppercase text-outline">
              SYNCHRONIZING ORDER DOSSIER...
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-surface-container-low p-10 text-center space-y-4">
              <p className="font-data-mono text-sm text-on-surface-variant uppercase">
                NO ORDERS FOUND ON THIS CLIENT DOSSIER YET.
              </p>
              <Link
                className="inline-block bg-on-surface text-surface px-6 py-3 font-label-caps-sm text-xs uppercase tracking-widest font-bold"
                href="/shop"
              >
                ACQUIRE FIRST ARCHIVE PIECE
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <article
                  className="bg-surface-container-low p-6 md:p-8 space-y-6"
                  key={order.id}
                >
                  {/* Header Metadata */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 bg-surface-container-low">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-on-surface text-surface px-2.5 py-1 font-data-mono text-xs font-bold">
                          {order.orderNumber}
                        </span>
                        <span className="bg-surface-container-highest text-primary-fixed px-2.5 py-1 font-data-mono text-[11px] uppercase">
                          {order.status.replace('_', ' ')}
                        </span>
                        <span className="font-data-mono text-xs text-outline">
                          ROUTE: {order.destinationCode} {'//'}{' '}
                          {order.carrierName}
                        </span>
                      </div>
                      <p className="font-data-mono text-xs text-on-surface-variant">
                        WAYBILL: {order.trackingNumber} {'//'} PLACED:{' '}
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-left lg:text-right">
                        <span className="block font-label-caps-sm text-[10px] text-outline uppercase">
                          TOTAL SETTLED
                        </span>
                        <span className="font-data-mono text-lg text-on-surface">
                          {formatPrice(order.totalUsd)}
                        </span>
                      </div>
                      <Link
                        className="bg-surface-container-high hover:bg-on-surface hover:text-surface text-on-surface px-4 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-wider transition-colors"
                        href={`/checkout/confirmation?order=${encodeURIComponent(
                          order.orderNumber,
                        )}`}
                      >
                        MANIFEST &amp; RECEIPT
                      </Link>
                    </div>
                  </div>

                  {/* 4-Step Telemetry Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PIPELINE_STEPS.map((label, idx) => {
                      const stepNo = idx + 1;
                      const reached = (order.milestoneStep || 1) >= stepNo;
                      return (
                        <div
                          className={`p-3 ${
                            reached
                              ? 'bg-surface-container-high text-on-surface'
                              : 'bg-surface-container-lowest text-outline'
                          }`}
                          key={label}
                        >
                          <div className="flex items-center justify-between font-data-mono text-[10px]">
                            <span>0{stepNo}</span>
                            {reached ? (
                              <span className="text-primary-fixed">ACTIVE</span>
                            ) : (
                              <span>QUEUED</span>
                            )}
                          </div>
                          <p className="font-label-caps-sm text-[11px] uppercase tracking-wider mt-1">
                            {label}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mini Garment Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {order.items.map((item) => (
                      <div
                        className="bg-surface-container p-3 flex items-center gap-3.5"
                        key={item.id}
                      >
                        <div className="relative w-16 h-20 bg-surface-container-lowest shrink-0 overflow-hidden">
                          <Image
                            alt={item.name}
                            className="object-cover"
                            fill
                            sizes="64px"
                            src={item.imageUrl}
                          />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="font-label-caps-sm text-xs uppercase truncate">
                            {item.name}
                          </p>
                          <p className="font-data-mono text-[10px] text-outline">
                            {item.sku} {'//'} {item.size} / {item.colorName}
                          </p>
                          <p className="font-data-mono text-xs text-on-surface-variant">
                            QTY {item.quantity} × {formatPrice(item.unitPrice)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Edit Profile Dialog */}
      <ModalDialog
        maxWidthClass="max-w-lg"
        onClose={() => setEditOpen(false)}
        open={editOpen}
        titleId="edit-profile-title"
      >
        <form
          className="p-6 md:p-8 space-y-5"
          onSubmit={(e) => void handleSaveProfile(e)}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-data-mono text-[10px] text-outline uppercase">
                DOSSIER CONFIGURATION
              </p>
              <h2
                className="font-headline-md text-headline-md uppercase mt-1"
                id="edit-profile-title"
              >
                EDIT PATRON PROFILE
              </h2>
            </div>
            <button
              aria-label="Close edit profile modal"
              onClick={() => setEditOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="prof-name"
              >
                PATRON NAME
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm focus:outline-none"
                id="prof-name"
                onChange={(e) => setNameInput(e.target.value)}
                required
                value={nameInput}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="prof-phone"
              >
                SMS &amp; WHATSAPP CONCIERGE NUMBER
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm focus:outline-none"
                id="prof-phone"
                onChange={(e) => setPhoneInput(e.target.value)}
                value={phoneInput}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="prof-hub"
              >
                PREFERRED ATELIER NODE
              </label>
              <select
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm focus:outline-none"
                id="prof-hub"
                onChange={(e) => setHubInput(e.target.value)}
                value={hubInput}
              >
                <option value="COLOMBO FLAGSHIP #01">
                  COLOMBO FLAGSHIP #01
                </option>
                <option value="LONDON MAYFAIR SUITE">
                  LONDON MAYFAIR SUITE
                </option>
                <option value="DUBAI PRIVATE VAULT">DUBAI PRIVATE VAULT</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="prof-notes"
              >
                SIZING &amp; HANDLING NOTES FOR LIAISON
              </label>
              <textarea
                className="w-full bg-surface-container-highest px-4 py-3 font-body-sm text-sm focus:outline-none min-h-20"
                id="prof-notes"
                onChange={(e) => setNotesInput(e.target.value)}
                value={notesInput}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 bg-on-surface text-surface py-3 font-label-caps-sm text-xs uppercase tracking-widest font-bold hover:bg-primary-fixed transition-colors disabled:opacity-50"
              disabled={savingProfile}
              type="submit"
            >
              {savingProfile ? 'SAVING...' : 'COMMIT CHANGES'}
            </button>
            <button
              className="bg-surface-container-high px-5 py-3 font-label-caps-sm text-xs uppercase tracking-widest"
              onClick={() => setEditOpen(false)}
              type="button"
            >
              CANCEL
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Security & Cryptographic Keys Dialog */}
      <ModalDialog
        maxWidthClass="max-w-lg"
        onClose={() => setKeysOpen(false)}
        open={keysOpen}
        titleId="security-keys-title"
      >
        <div className="p-6 md:p-8 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-data-mono text-[10px] text-outline uppercase">
                ECDSA-SECP256K1 // POLYGON CUSTODY
              </p>
              <h2
                className="font-headline-md text-headline-md uppercase mt-1"
                id="security-keys-title"
              >
                SECURITY &amp; CRYPTOGRAPHIC KEYS
              </h2>
            </div>
            <button
              aria-label="Close security modal"
              onClick={() => setKeysOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <dl className="space-y-3 bg-surface-container p-4 font-data-mono text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-outline">BOUND POLYGON WALLET</dt>
              <dd className="text-on-surface break-all text-right">
                {dossier?.walletFull || '0x7F91A30C4B118E9A2C4E'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-outline">KYC VERIFICATION STATUS</dt>
              <dd className="text-primary-fixed">
                {dossier?.kycStatus || 'VERIFIED_TIER_01'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-outline">ASSIGNED LIAISON</dt>
              <dd>{dossier?.liaisonName || 'Sara K. (Colombo)'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-outline">RESTORATION PASSES</dt>
              <dd>
                {dossier?.restorationPassesRemaining ?? 3} /{' '}
                {dossier?.restorationPassesTotal ?? 3} AVAILABLE
              </dd>
            </div>
          </dl>

          <div className="flex gap-3">
            <Link
              className="flex-1 text-center bg-on-surface text-surface py-3 font-label-caps-sm text-xs uppercase tracking-widest font-bold hover:bg-primary-fixed transition-colors"
              href="/vault"
              onClick={() => setKeysOpen(false)}
            >
              OPEN NFC VAULT
            </Link>
            <button
              className="bg-surface-container-high px-5 py-3 font-label-caps-sm text-xs uppercase tracking-widest"
              onClick={() => setKeysOpen(false)}
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
