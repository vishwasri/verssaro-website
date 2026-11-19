'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useStore } from './StoreContext';
import { VerssaroMark } from './VerssaroMark';

const ADMIN_NAV = [
  { href: '/admin', label: 'ATELIER COMMAND', icon: 'dashboard' },
  { href: '/admin/catalog', label: 'CATALOG MATRIX', icon: 'grid_view' },
  { href: '/admin/orders', label: 'ORDERS & DISPATCH', icon: 'local_shipping' },
  { href: '/admin/inventory', label: 'INVENTORY STOCK', icon: 'warehouse' },
  { href: '/admin/clients', label: 'PATRON CLIENTS', icon: 'badge' },
  { href: '/admin/promotions', label: 'PROMOTIONS & PRIVILEGES', icon: 'vpn_key' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { announce } = useStore();
  const [lockdownActive, setLockdownActive] = useState(false);
  const [utcNow, setUtcNow] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setUtcNow(now.toISOString().replace('T', ' // ').slice(0, 22) + ' UTC');
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);

    apiFetch<{ botLockdownActive: boolean }>('/admin/dashboard')
      .then((d) => setLockdownActive(Boolean(d.botLockdownActive)))
      .catch(() => {});

    return () => clearInterval(timer);
  }, []);

  const toggleLockdown = async () => {
    const next = !lockdownActive;
    try {
      await apiFetch('/admin/system/lockdown', {
        method: 'POST',
        body: JSON.stringify({ botLockdownActive: next }),
      });
      setLockdownActive(next);
      announce(
        next ? 'SHIELD LVL 5 // BOT LOCKDOWN ENGAGED' : 'BOT LOCKDOWN RELEASED',
      );
    } catch {
      announce('FAILED TO TOGGLE LOCKDOWN', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col lg:flex-row">
      {/* Persistent Atelier HQ Left Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 bg-surface-container-lowest flex flex-col justify-between p-4 lg:min-h-screen">
        <div className="space-y-6">
          <div className="flex items-center justify-between lg:justify-start gap-3 px-2 py-2">
            <Link className="flex items-center gap-2.5" href="/">
              <VerssaroMark className="w-6 h-6" />
              <div>
                <div className="font-display-xl text-lg tracking-tight uppercase">
                  VERSSARO
                </div>
                <div className="font-data-mono text-[10px] text-outline uppercase">
                  ATELIER HQ // CONSOLE
                </div>
              </div>
            </Link>
            <Link
              className="lg:hidden bg-surface-container px-2.5 py-1 font-data-mono text-[10px] uppercase text-on-surface"
              href="/"
            >
              STOREFRONT
            </Link>
          </div>

          <nav
            aria-label="Admin Operations Navigation"
            className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible no-scrollbar"
          >
            {ADMIN_NAV.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  className={`flex items-center gap-3 px-3 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-wider whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-on-surface text-surface font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:flex flex-col gap-3 pt-6">
          <div className="bg-surface-container p-3 space-y-1 font-data-mono text-[11px]">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>POLYGON ROLLUP SYNC</span>
            </div>
            <p className="text-outline">COLOMBO // LONDON // DUBAI</p>
          </div>

          <Link
            className="bg-surface-container-high hover:bg-surface-bright text-on-surface px-3 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest flex items-center justify-between transition-colors"
            href="/"
          >
            <span>EXIT TO STOREFRONT</span>
            <span className="material-symbols-outlined text-base">
              arrow_outward
            </span>
          </Link>
        </div>
      </aside>

      {/* Main Operations Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global Live Telemetry Ribbon */}
        <header className="bg-surface-container-low px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 font-data-mono text-[11px] uppercase text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYS-LIVE // ACTIVE
            </span>
            <span className="text-outline">/</span>
            <span>NODE: Colombo Flagship #01</span>
            <span className="hidden sm:inline text-outline">/</span>
            <span className="hidden sm:inline">SYNC: 99.98% (2ms)</span>
            <span className="hidden md:inline text-outline">/</span>
            <span className="hidden md:inline">GAS POOL: $14,280 MATIC</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden xl:inline font-data-mono text-[11px] text-outline">
              {utcNow || '2025-11-12 UTC'}
            </span>
            <button
              aria-pressed={lockdownActive}
              className={`px-3 py-1.5 font-label-caps-sm text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-colors ${
                lockdownActive
                  ? 'bg-crimson text-on-surface font-bold'
                  : 'bg-surface-container-highest text-on-surface hover:bg-crimson'
              }`}
              onClick={() => void toggleLockdown()}
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">
                shield
              </span>
              <span>
                {lockdownActive ? 'LOCKDOWN ACTIVE' : 'BOT LOCKDOWN'}
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 min-w-0" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

