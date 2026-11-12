'use client';

import React from 'react';
import Link from 'next/link';
import { StorefrontShell } from './StorefrontShell';

const ATELIER_SHOWCASE_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBE6e6EBQKUJ1eczzDqIzFFmY9Ga3i3IqC6R7oo7HbmFgwUQZm15E2EeipoL61ktTqpdr6S30OYGHt4uAgnvQ-hHOIgWhrhzBle1mYkU1ciBGTNeDMDjNKyAZd0N1yNFQguXo1GWqG7WnLxWrzeXFkwR12FtY7X32jFRezQdvT3LyFzqMcYDNxINWETrqYXywJiPmKTsllk11oB3p-_nUe4j0T57YBhoRZh5YrJI4Q';

const PRIVILEGE_PILLARS = [
  {
    icon: 'verified_user',
    code: 'VAULT // NFC SILICON',
    title: 'ON-CHAIN PROVENANCE OWNERSHIP',
    description:
      'Bind serialized NTAG 424 DNA garment tags directly to your dossier Polygon wallet address.',
  },
  {
    icon: 'schedule',
    code: 'WHITELIST // 24H EARLY',
    title: 'PRIVATE CAPSULE ALLOCATION',
    description:
      'Unlock encrypted release keys ahead of general public launches across 320–520 GSM drops.',
  },
  {
    icon: 'auto_fix_high',
    code: 'ATELIER // CARE PROTOCOL',
    title: 'RESTORATION & PRIORITY COURIER',
    description:
      'Includes complimentary Colombo flagship tailoring passes and dedicated dispatch tracking.',
  },
];

interface AuthShellProps {
  mode: 'signin' | 'signup';
  eyebrow: string;
  codeLabel: string;
  title: string;
  subtitle: string;
  headingId: string;
  children: React.ReactNode;
}

/**
 * Shared architectural split shell for patron Sign In and Sign Up pages,
 * keeping the primary credential form first in DOM and top-visible on mobile.
 */
export function AuthShell({
  mode,
  eyebrow,
  codeLabel,
  title,
  subtitle,
  headingId,
  children,
}: AuthShellProps) {
  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-8 md:py-14 space-y-8">
        {/* Top Navigation & Mode Toggle Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            className="inline-flex items-center gap-2 font-data-mono text-[11px] uppercase tracking-[0.18em] text-outline hover:text-on-surface transition-colors"
            href="/shop"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
              west
            </span>
            <span>RETURN TO ARCHIVE STORE</span>
          </Link>

          <nav
            aria-label="Patron authentication mode"
            className="inline-flex bg-surface-container-low p-1 gap-1"
          >
            <Link
              aria-current={mode === 'signin' ? 'page' : undefined}
              className={`px-4 py-2 font-label-caps-sm text-[11px] uppercase tracking-[0.18em] transition-colors ${
                mode === 'signin'
                  ? 'bg-on-surface text-surface font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
              href="/signin"
            >
              SIGN IN
            </Link>
            <Link
              aria-current={mode === 'signup' ? 'page' : undefined}
              className={`px-4 py-2 font-label-caps-sm text-[11px] uppercase tracking-[0.18em] transition-colors ${
                mode === 'signup'
                  ? 'bg-on-surface text-surface font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
              href="/signup"
            >
              CREATE ACCOUNT
            </Link>
          </nav>
        </div>

        {/* 12-Column Split Editorial Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Primary Credential Form Column (DOM-first for keyboard & mobile clearance) */}
          <section
            aria-labelledby={headingId}
            className="lg:col-span-6 bg-surface-container-low p-6 sm:p-8 md:p-10 space-y-7"
          >
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="bg-on-surface text-surface px-2.5 py-1 font-data-mono text-[10px] uppercase tracking-[0.2em] font-bold">
                  {eyebrow}
                </span>
                <span className="bg-surface-container-highest text-primary-fixed px-2.5 py-1 font-data-mono text-[10px] uppercase tracking-[0.18em]">
                  {codeLabel}
                </span>
              </div>

              <h1
                className="font-headline-lg text-2xl sm:text-headline-lg uppercase tracking-tight text-on-surface"
                id={headingId}
              >
                {title}
              </h1>

              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                {subtitle}
              </p>
            </header>

            {children}

            <div className="bg-surface-container p-4 flex flex-wrap items-center justify-between gap-3 font-data-mono text-[11px] uppercase tracking-wider">
              <span className="text-outline">
                {mode === 'signin'
                  ? 'NEW TO VERSSARO ARCHIVE?'
                  : 'ALREADY REGISTERED TO DOSSIER?'}
              </span>
              <Link
                className="text-on-surface hover:text-primary-fixed underline underline-offset-4 font-bold inline-flex items-center gap-1.5"
                href={mode === 'signin' ? '/signup' : '/signin'}
              >
                <span>
                  {mode === 'signin' ? 'CREATE ACCOUNT' : 'SIGN IN INSTEAD'}
                </span>
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                  east
                </span>
              </Link>
            </div>
          </section>

          {/* Editorial Atelier Showcase & Membership Telemetry */}
          <aside className="lg:col-span-6 bg-surface-container-low overflow-hidden">
            <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[5/4] bg-surface-container-lowest overflow-hidden">
              <img
                alt="VERSSARO heavyweight architectural outerwear editorial in obsidian studio lighting"
                className="w-full h-full object-cover object-center grayscale contrast-110 brightness-90"
                src={ATELIER_SHOWCASE_IMAGE}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface/35 to-transparent"
              />
              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-data-mono text-[10px] uppercase tracking-[0.22em] text-primary-fixed">
                    COLOMBO {'//'} LONDON {'//'} DUBAI
                  </p>
                  <p className="font-headline-sm text-lg uppercase text-on-surface mt-1">
                    ARCHIVE DOSSIER ACCESS
                  </p>
                </div>
                <span className="bg-surface/85 backdrop-blur-sm text-on-surface px-3 py-1.5 font-data-mono text-[10px] uppercase tracking-[0.18em]">
                  AES-GCM + JWT SECURED
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-5 bg-surface-container">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-label-caps-lg text-label-caps-lg uppercase tracking-[0.2em] text-on-surface">
                  PATRON DOSSIER PRIVILEGES
                </h2>
                <span className="font-data-mono text-[10px] uppercase tracking-[0.16em] text-outline">
                  SERIES 01–02
                </span>
              </div>

              <div className="space-y-3">
                {PRIVILEGE_PILLARS.map((item) => (
                  <div
                    className="bg-surface-container-high p-4 flex items-start gap-3.5"
                    key={item.code}
                  >
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-[20px] text-primary-fixed shrink-0 mt-0.5"
                    >
                      {item.icon}
                    </span>
                    <div className="space-y-1">
                      <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-outline">
                        {item.code}
                      </p>
                      <h3 className="font-label-caps-sm text-[11px] uppercase tracking-[0.14em] text-on-surface">
                        {item.title}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </StorefrontShell>
  );
}
