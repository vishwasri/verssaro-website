'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { useStore } from '@/components/StoreContext';
import { apiFetch } from '@/lib/api';

interface DashboardData {
  kpis: {
    grossRevenueUsd?: number;
    orderCount?: number;
    enquiryCount?: number;
    vaultAssetsUsd?: number;
    productCount?: number;
    hubLoads?: Array<{ node: string; capPercent: number }>;
  };
  dropVelocitySeries?: Array<{
    day: string;
    primaryMint: number;
    resaleFloor: number;
  }>;
  recentOrders?: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    destinationCode: string;
    totalUsd: number;
    status: string;
  }>;
  recentEnquiries?: Array<{
    id: string;
    enquiryCode: string;
    customerName: string;
    status: string;
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
    const rows = [
      ['Metric', 'Value'],
      ['Gross Revenue (USD)', data?.kpis?.grossRevenueUsd ?? 0],
      ['Total Orders', data?.kpis?.orderCount ?? 0],
      ['Total Enquiries', data?.kpis?.enquiryCount ?? 0],
      ['Inventory Assets (USD)', data?.kpis?.vaultAssetsUsd ?? 0],
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VERSSARO_TELEMETRY_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    announce('CSV report exported successfully');
  };

  const series = data?.dropVelocitySeries ?? [
    { day: 'WEEK 1', primaryMint: 25, resaleFloor: 45 },
    { day: 'WEEK 2', primaryMint: 50, resaleFloor: 45 },
    { day: 'WEEK 3', primaryMint: 85, resaleFloor: 45 },
    { day: 'WEEK 4', primaryMint: 120, resaleFloor: 45 },
  ];
  const maxVal = Math.max(...series.flatMap((s) => [s.primaryMint, s.resaleFloor]), 1);

  return (
    <AdminShell>
      <div className="space-y-8">
        {/* Page Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
          <div>
            <span className="font-label-caps-sm text-[10px] uppercase text-outline">
              ATELIER HQ COMMAND
            </span>
            <h1 className="font-headline-lg text-2xl uppercase mt-1">
              HERITAGE TELEMETRY &amp; FULFILLMENT
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="bg-surface-container-high hover:bg-surface-container-highest px-4 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors"
              onClick={handleExportCsv}
              type="button"
            >
              EXPORT CSV REPORT
            </button>
            <Link
              className="bg-[#d9b25c] text-[#0a0a0a] hover:bg-[#f1d38c] px-5 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest font-bold transition-colors"
              href="/admin/catalog"
            >
              + MANAGE PIECES
            </Link>
          </div>
        </header>

        {/* 4 Telemetry KPI Modules */}
        <section
          aria-label="Key Performance Indicators"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          <div className="bg-surface-container-low p-6 space-y-2 border border-[#d9b25c]/10">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              GROSS REVENUE
            </span>
            <p className="font-data-mono text-2xl text-on-surface">
              {formatPrice(data?.kpis?.grossRevenueUsd ?? 0)}
            </p>
            <p className="font-data-mono text-xs text-[#d9b25c]">
              FROM VERIFIED ORDERS
            </p>
          </div>

          <div className="bg-surface-container-low p-6 space-y-2 border border-[#d9b25c]/10">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              TOTAL ORDERS
            </span>
            <p className="font-data-mono text-2xl text-on-surface">
              {data?.kpis?.orderCount ?? 0}
            </p>
            <p className="font-data-mono text-xs text-outline">
              FULFILLED &amp; PROCESSING
            </p>
          </div>

          <div className="bg-surface-container-low p-6 space-y-2 border border-[#d9b25c]/10">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              CLIENT ENQUIRIES
            </span>
            <p className="font-data-mono text-2xl text-on-surface">
              {data?.kpis?.enquiryCount ?? 0}
            </p>
            <p className="font-data-mono text-xs text-[#d9b25c]">
              NEW INCOMING REQUESTS
            </p>
          </div>

          <div className="bg-surface-container-low p-6 space-y-2 border border-[#d9b25c]/10">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline tracking-wider">
              INVENTORY VALUATION
            </span>
            <p className="font-data-mono text-2xl text-on-surface">
              {formatPrice(data?.kpis?.vaultAssetsUsd ?? 0)}
            </p>
            <p className="font-data-mono text-xs text-outline">
              COLOMBO ATELIER VAULT
            </p>
          </div>
        </section>

        {/* Chart + Hub Utilization Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-surface-container-low p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-label-caps-sm text-[10px] uppercase text-outline">
                  ORDER &amp; ENQUIRY VELOCITY
                </span>
                <h2 className="font-headline-md text-lg uppercase mt-0.5">
                  MONTHLY DROP VELOCITY
                </h2>
              </div>
            </div>

            <div className="h-56 bg-surface-container p-4 flex items-end gap-4">
              {series.map((point) => {
                const mintH = Math.round((point.primaryMint / maxVal) * 140);
                return (
                  <div
                    key={point.day}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                  >
                    <div
                      className="w-full bg-[#d9b25c] transition-all duration-500"
                      style={{ height: `${Math.max(12, mintH)}px` }}
                    />
                    <span className="font-data-mono text-[9px] text-outline text-center">
                      {point.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hub Load */}
          <div className="lg:col-span-4 bg-surface-container-low p-6 space-y-4">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline">
              FULFILLMENT CAPACITIES
            </span>
            <h2 className="font-headline-md text-lg uppercase">ATELIER DISPATCH</h2>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between font-label-caps-sm text-xs">
                  <span>COLOMBO FLAGSHIP</span>
                  <span>95%</span>
                </div>
                <div className="h-2 bg-surface-container-highest">
                  <div className="h-full bg-[#d9b25c] w-[95%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <section className="bg-surface-container-low p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-lg uppercase">
              RECENT ORDERS &amp; DISPATCHES
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs uppercase tracking-wider text-[#d9b25c] hover:underline"
            >
              VIEW ALL ORDERS →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-outline-variant/30 text-outline uppercase">
                  <th className="py-2">Order #</th>
                  <th className="py-2">Client</th>
                  <th className="py-2">Dest</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {(data?.recentOrders || []).map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 text-[#d9b25c]">{o.orderNumber}</td>
                    <td className="py-3 text-on-surface">{o.customerName}</td>
                    <td className="py-3 text-outline">{o.destinationCode}</td>
                    <td className="py-3">{formatPrice(o.totalUsd)}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-[#d9b25c]/20 text-[#d9b25c] text-[10px] uppercase">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
