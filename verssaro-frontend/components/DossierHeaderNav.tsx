'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { apiFetch, getErrorMessage, setAuthToken } from '@/lib/api';
import { ModalDialog } from './ModalDialog';
import { useStore } from './StoreContext';

export type DossierTabKey = 'orders' | 'wishlist' | 'vault' | 'addresses';

const DOSSIER_TABS: Array<{
  key: DossierTabKey;
  href: string;
  label: string;
  icon: string;
}> = [
  {
    key: 'orders',
    href: '/account',
    label: 'ORDER HISTORY',
    icon: 'receipt_long',
  },
  {
    key: 'wishlist',
    href: '/wishlist',
    label: 'SAVED ARCHIVE',
    icon: 'bookmark',
  },
  {
    key: 'vault',
    href: '/vault',
    label: 'NFC PROVENANCE VAULT',
    icon: 'nfc',
  },
  {
    key: 'addresses',
    href: '/account/addresses',
    label: 'SHIPPING DOSSIERS',
    icon: 'location_on',
  },
];

export function DossierHeaderNav({
  activeTab,
  title,
  subtitle,
  rightSlot,
}: {
  activeTab: DossierTabKey;
  title: string;
  subtitle: string;
  rightSlot?: React.ReactNode;
}) {
  const {
    dossier,
    wishlist,
    isAuthenticated,
    refreshDossier,
    signOut,
    announce,
  } = useStore();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('alexander.wright@verssaro.vip');
  const [loginPassword, setLoginPassword] = useState('verssaro2025');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch<{
        accessToken: string;
        user: { name: string };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });
      setAuthToken(res.accessToken);
      await refreshDossier();
      setAuthModalOpen(false);
      announce(`AUTHENTICATED AS ${res.user.name.toUpperCase()}`);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, 'AUTHENTICATION FAILED'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Top Dossier Identity Banner */}
      <div className="bg-surface-container-low p-6 md:p-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-on-surface text-surface px-2.5 py-1 font-data-mono text-[10px] uppercase tracking-[0.2em] font-bold">
              {dossier?.dossierCode || 'DOSSIER // 0842-AW'}
            </span>
            <span className="bg-surface-container-highest text-primary-fixed px-2.5 py-1 font-data-mono text-[10px] uppercase tracking-[0.16em]">
              {dossier?.tier || 'TIER 01 // SOVEREIGN ARCHIVE'}
            </span>
            <span className="font-data-mono text-[11px] text-outline uppercase">
              ATELIER LIAISON: {dossier?.liaisonName || 'SARA K. (COLOMBO)'}
            </span>
          </div>

          <h1 className="font-headline-lg text-2xl md:text-headline-lg uppercase tracking-tight">
            {title}
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {rightSlot}
          <button
            className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-4 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors flex items-center gap-2"
            onClick={() => setAuthModalOpen(true)}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">
              vpn_key
            </span>
            <span>{dossier?.name || 'ALEXANDER WRIGHT'}</span>
          </button>
          {isAuthenticated ? (
            <button
              className="bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant hover:text-on-surface px-4 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors"
              onClick={signOut}
              type="button"
            >
              SIGN OUT
            </button>
          ) : (
            <Link
              className="bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant hover:text-on-surface px-4 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors"
              href="/signin"
            >
              SIGN IN
            </Link>
          )}
          <Link
            className="bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant hover:text-on-surface px-4 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors"
            href="/shop"
          >
            RETURN TO STORE
          </Link>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <nav
        aria-label="Client Dossier Sub-Navigation"
        className="flex flex-wrap gap-2 bg-surface-container-lowest p-2"
      >
        {DOSSIER_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const badge =
            tab.key === 'wishlist' && wishlist.length > 0
              ? String(wishlist.length).padStart(2, '0')
              : null;
          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-2.5 px-4 py-3 font-label-caps-sm text-[11px] uppercase tracking-[0.16em] transition-colors ${
                isActive
                  ? 'bg-on-surface text-surface font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
              href={tab.href}
              key={tab.key}
            >
              <span className="material-symbols-outlined text-[16px]">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {badge ? (
                <span
                  className={`font-data-mono text-[10px] px-1.5 py-0.5 ${
                    isActive
                      ? 'bg-surface text-on-surface'
                      : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* VIP Identity Switch / Login Dialog */}
      <ModalDialog
        maxWidthClass="max-w-lg"
        onClose={() => setAuthModalOpen(false)}
        open={authModalOpen}
        titleId="dossier-auth-dialog-title"
      >
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-data-mono text-[10px] uppercase tracking-[0.2em] text-outline">
                PATRON IDENTITY PROTOCOL
              </p>
              <h2
                className="font-headline-md text-headline-md uppercase mt-1"
                id="dossier-auth-dialog-title"
              >
                CLIENT DOSSIER AUTHENTICATION
              </h2>
            </div>
            <button
              aria-label="Close modal"
              className="p-1 text-on-surface-variant hover:text-on-surface"
              onClick={() => setAuthModalOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="bg-surface-container p-4 space-y-1 font-data-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-outline">ACTIVE DOSSIER</span>
              <span>{dossier?.dossierCode || 'DOSSIER // 0842-AW'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">BOUND POLYGON WALLET</span>
              <span className="truncate max-w-[240px]">
                {dossier?.walletFull || '0x7F91A30C4B118E9A2C4E'}
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={(e) => void handleLogin(e)}>
            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="auth-email"
              >
                PATRON EMAIL
              </label>
              <input
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm text-on-surface focus:outline-none"
                id="auth-email"
                name="email"
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                spellCheck={false}
                type="email"
                value={loginEmail}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="auth-password"
              >
                ACCESS PASSPHRASE
              </label>
              <input
                autoComplete="current-password"
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm text-on-surface focus:outline-none"
                id="auth-password"
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                type="password"
                value={loginPassword}
              />
              <p className="font-data-mono text-[10px] text-outline">
                DEMO PATRONS: alexander.wright@verssaro.vip /
                julian.desilva@verssaro.vip (PASSWORD: verssaro2025)
              </p>
            </div>

            {errorMsg ? (
              <p className="font-data-mono text-xs text-error uppercase">
                {errorMsg}
              </p>
            ) : null}

            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 bg-on-surface text-surface py-3 font-label-caps-sm text-xs uppercase tracking-widest font-bold hover:bg-primary-fixed transition-colors disabled:opacity-50"
                disabled={submitting}
                type="submit"
              >
                {submitting ? 'VERIFYING...' : 'VERIFY & SWITCH DOSSIER'}
              </button>
              <button
                className="bg-surface-container-high px-5 py-3 font-label-caps-sm text-xs uppercase tracking-widest hover:bg-surface-container-highest"
                onClick={() => setAuthModalOpen(false)}
                type="button"
              >
                CLOSE
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 font-data-mono text-[11px] uppercase">
              <Link
                className="text-on-surface-variant hover:text-on-surface underline"
                href="/signin"
                onClick={() => setAuthModalOpen(false)}
              >
                SIGN IN PORTAL
              </Link>
              <Link
                className="text-on-surface-variant hover:text-on-surface underline"
                href="/signup"
                onClick={() => setAuthModalOpen(false)}
              >
                REGISTER NEW PATRON DOSSIER
              </Link>
            </div>
          </form>
        </div>
      </ModalDialog>
    </section>
  );
}
