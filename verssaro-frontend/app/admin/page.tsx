'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { useStore } from '@/components/StoreContext';
import { apiFetch } from '@/lib/api';

interface DashboardData {
  botLockdownActive: boolean;
  kpis: {
    grossRevenueUsd: number;
    grossRevenueDelta: string;
    nfcBindingsCount: number;
    totalNfcPool: number;
    pendingSeedingCount: number;
    p2pVolumeUsd: number;
    p2pTransfersCount: number;
    royaltyYieldUsd: number;
    vaultAssetsUsd: number;
    hubLoads: Array<{ node: string; capPercent: number }>;
  };
  dropVelocitySeries: Array<{
    day: string;
    primaryMint: number;
    resaleFloor: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    destinationCode: string;
    totalUsd: number;
    status: string;
  }>;
  recentTransfers: Array<{
    id: string;
    receiptCode: string;
    fromOwnerName: string;
    toOwnerName: string;
    valuationUsd: number;
    royaltyUsd: number;
    artifact?: { garmentTitle: string; uid: string } | null;
  }>;
}

export default function AdminDashboardPage() {
  const { formatPrice, announce } = useStore();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    apiFetch<DashboardData>('/admin/dashboard')
      .then(setData)
      .catch(() => {});
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines = [
      'TYPE,REF,PARTY,VALUE_USD,STATUS',
      ...data.recentOrders.map(
        (o) =>
          `ORDER,${o.orderNumber},"${o.customerName}",${o.totalUsd},${o.status}`,
      ),
      ...data.recentTransfers.map(
        (t) =>
          `TRANSFER,${t.receiptCode},"${t.fromOwnerName} -> ${t.toOwnerName}",${t.valuationUsd},CONFIRMED`,
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'verssaro-atelier-telemetry.csv';
    a.click();
    URL.revokeObjectURL(url);
    announce('EXPORTED ATELIER TELEMETRY CSV');
  };

  const series = data?.dropVelocitySeries ?? [];
  const maxVal = Math.max(
    1,
    ...series.map((s) => Math.max(s.primaryMint, s.resaleFloor)),
  );

  return (
    <AdminShell>
      <div className="space-y-8">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-data-mono text-[11px] text-primary-fixed uppercase tracking-[0.2em]">
              ATELIER HQ // COMMAND TELEMETRY
            </p>
            <h1 className="font-headline-lg text-2xl md:text-headline-lg uppercase mt-1">
              OPERATIONAL OVERVIEW
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="bg-surface-container-high hover:bg-surface-container-highest px-4 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors"
              onClick={handleExportCsv}
              type="button"
            >
              EXPORT CSV REPORT
            </button>
            <Link
              className="bg-on-surface text-surface hover:bg-primary-fixed px-5 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest font-bold transition-colors"
              href="/admin/promotions"
            >
              + DEPLOY SECRET DROP
            </Link>
          </div>
        </header>

        {/* 4 Telemetry KPI Modules */}
        <section
          aria-label="Key Performance Indicators"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          <div className="bg-surface-container-low p-6 space-y-2">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              GROSS REVENUE (MTD)
            </span>
            <p className="font-data-mono text-2xl text-on-surface">
              {formatPrice(data?.kpis.grossRevenueUsd ?? 482900)}
            </p>
            <p className="font-data-mono text-xs text-primary-fixed">
              {data?.kpis.grossRevenueDelta ?? '+24.4%'} VS PRIOR CYCLE
            </p>
          </div>

          <div className="bg-surface-container-low p-6 space-y-2">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              NFC SILICON BINDINGS
            </span>
            <p className="font-data-mono text-2xl text-on-surface">
              {data?.kpis.nfcBindingsCount ?? 1420} /{' '}
              {data?.kpis.totalNfcPool ?? 1500}
            </p>
            <p className="font-data-mono text-xs text-outline">
              {data?.kpis.pendingSeedingCount ?? 1} PENDING SEEDING IN VAULT
            </p>
          </div>

          <div className="bg-surface-container-low p-6 space-y-2">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              P2P SECONDARY VOLUME
            </span>
            <p className="font-data-mono text-2xl text-on-surface">
              {formatPrice(data?.kpis.p2pVolumeUsd ?? 184200)}
            </p>
            <p className="font-data-mono text-xs text-primary-fixed">
              {formatPrice(data?.kpis.royaltyYieldUsd ?? 9210)} (5% ROYALTY
              YIELD)
            </p>
          </div>

          <div className="bg-surface-container-low p-6 space-y-2">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              PHYSICAL VAULT INVENTORY
            </span>
            <p className="font-data-mono text-2xl text-on-surface">
              {formatPrice(data?.kpis.vaultAssetsUsd ?? 0)}
            </p>
            <p className="font-data-mono text-xs text-outline">
              ACROSS CMB // LHR // DXB NODES
            </p>
          </div>
        </section>

        {/* Chart + Hub Utilization Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SVG Drop Velocity vs Resale Trajectory Chart */}
          <div className="lg:col-span-8 bg-surface-container-low p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-label-caps-sm text-[10px] uppercase text-outline">
                  MARKET VALUATION TELEMETRY
                </span>
                <h2 className="font-headline-md text-lg uppercase mt-0.5">
                  DROP VELOCITY VS SECONDARY FLOOR
                </h2>
              </div>
              <div className="flex items-center gap-4 font-data-mono text-[11px]">
                <span className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="w-2.5 h-2.5 bg-outline inline-block" />
                  PRIMARY MINT
                </span>
                <span className="flex items-center gap-1.5 text-primary-fixed">
                  <span className="w-2.5 h-2.5 bg-primary-fixed inline-block" />
                  RESALE FLOOR
                </span>
              </div>
            </div>

            <div className="h-56 bg-surface-container p-4 flex items-end gap-4">
              {series.map((point) => {
                const mintH = Math.round((point.primaryMint / maxVal) * 140);
                const resaleH = Math.round((point.resaleFloor / maxVal) * 140);
                return (
                  <div
                    className="flex-1 flex flex-col items-center justify-end gap-2 h-full"
                    key={point.day}
                  >
                    <div className="w-full flex items-end justify-center gap-2 flex-1">
                      <div
                        className="w-5 bg-outline transition-all"
                        style={{ height: `${Math.max(8, mintH)}px` }}
                        title={`Primary: $${point.primaryMint}`}
                      />
                      <div
                        className="w-5 bg-primary-fixed transition-all"
                        style={{ height: `${Math.max(8, resaleH)}px` }}
                        title={`Resale Floor: $${point.resaleFloor}`}
                      />
                    </div>
                    <span className="font-data-mono text-[10px] text-outline text-center">
                      {point.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Global Node Capacity Bars */}
          <div className="lg:col-span-4 bg-surface-container-low p-6 space-y-5">
            <div>
              <span className="font-label-caps-sm text-[10px] uppercase text-outline">
                LOGISTICS UTILIZATION
              </span>
              <h2 className="font-headline-md text-lg uppercase mt-0.5">
                ATELIER HUB CAPACITY LOAD
              </h2>
            </div>

            <div className="space-y-4">
              {(data?.kpis.hubLoads ?? []).map((hub) => (
                <div className="space-y-1.5" key={hub.node}>
                  <div className="flex justify-between font-data-mono text-xs">
                    <span>{hub.node}</span>
                    <span className="text-primary-fixed">{hub.capPercent}%</span>
                  </div>
                  <div className="h-2 bg-surface-container-highest overflow-hidden">
                    <div
                      className="h-full bg-on-surface"
                      style={{ width: `${hub.capPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                className="block text-center bg-surface-container-high hover:bg-on-surface hover:text-surface py-3 font-label-caps-sm text-xs uppercase tracking-widest transition-colors"
                href="/admin/inventory"
              >
                MANAGE INTER-VAULT STOCK →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom 2-Column Live Feeds */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-surface-container-low p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-base uppercase">
                RECENT DISPATCH QUEUE
              </h2>
              <Link
                className="font-data-mono text-xs text-primary-fixed hover:underline"
                href="/admin/orders"
              >
                OPEN CONSOLE →
              </Link>
            </div>
            <div className="space-y-2">
              {(data?.recentOrders ?? []).map((o) => (
                <div
                  className="bg-surface-container p-3 flex items-center justify-between gap-4 font-data-mono text-xs"
                  key={o.id}
                >
                  <div>
                    <p className="text-on-surface font-bold">{o.orderNumber}</p>
                    <p className="text-outline text-[11px]">
                      {o.customerName} {'//'} {o.destinationCode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>{formatPrice(o.totalUsd)}</p>
                    <p className="text-[10px] text-primary-fixed">{o.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transfers */}
          <div className="bg-surface-container-low p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-base uppercase">
                RECENT P2P LEDGER EVENTS
              </h2>
              <Link
                className="font-data-mono text-xs text-primary-fixed hover:underline"
                href="/admin/ledger"
              >
                VIEW STREAM →
              </Link>
            </div>
            <div className="space-y-2">
              {(data?.recentTransfers ?? []).map((t) => (
                <div
                  className="bg-surface-container p-3 flex items-center justify-between gap-4 font-data-mono text-xs"
                  key={t.id}
                >
                  <div className="min-w-0">
                    <p className="text-on-surface font-bold truncate">
                      {t.artifact?.garmentTitle || t.receiptCode}
                    </p>
                    <p className="text-outline text-[11px] truncate">
                      {t.fromOwnerName} → {t.toOwnerName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p>{formatPrice(t.valuationUsd)}</p>
                    <p className="text-[10px] text-primary-fixed">
                      +{formatPrice(t.royaltyUsd)} ROYALTY
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
