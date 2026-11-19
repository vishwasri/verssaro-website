'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { useStore } from '@/components/StoreContext';
import { apiFetch, getErrorMessage } from '@/lib/api';

interface InventoryRow {
  productId: string;
  sku: string;
  name: string;
  subtitle: string;
  category: string;
  totalStock: number;
  colombo: number;
  reserved: number;
  available: number;
  status: string;
  sizes: Array<{ size: string; stock: number; colombo?: number }>;
}

interface InventoryResponse {
  rows: InventoryRow[];
  movements: any[];
}

export default function AdminInventoryPage() {
  const { announce } = useStore();
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<InventoryResponse>('/admin/inventory')
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        announce(getErrorMessage(err, 'Failed to load inventory'), 'error');
        setLoading(false);
      });
  }, [announce]);

  const rows = data?.rows ?? [];
  const totalUnits = rows.reduce((s, r) => s + r.totalStock, 0);
  const totalAvailable = rows.reduce((s, r) => s + r.available, 0);

  return (
    <AdminShell>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-data-mono text-[11px] text-[#d9b25c] uppercase tracking-[0.2em]">
              ATELIER INVENTORY // STOCK CONTROLS
            </p>
            <h1 className="font-headline-lg text-2xl md:text-3xl uppercase mt-1">
              HERITAGE PIECES STOCK MATRIX
            </h1>
          </div>

          <Link
            href="/admin/catalog"
            className="bg-[#d9b25c] text-[#0a0a0a] hover:bg-[#f1d38c] px-5 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest font-bold transition-colors inline-block text-center"
          >
            EDIT CATALOG &amp; SIZES
          </Link>
        </header>

        {/* Node Totals */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-low p-5 border border-[#d9b25c]/10">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              TOTAL CATALOG UNITS
            </span>
            <p className="font-data-mono text-2xl mt-1 text-on-surface">
              {totalUnits} UNITS
            </p>
          </div>
          <div className="bg-surface-container-low p-5 border border-[#d9b25c]/10">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              COLOMBO ATELIER STOCK
            </span>
            <p className="font-data-mono text-2xl mt-1 text-[#d9b25c]">
              {rows.reduce((s, r) => s + (r.colombo || r.totalStock), 0)} UNITS
            </p>
          </div>
          <div className="bg-surface-container-low p-5 border border-[#d9b25c]/10">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              AVAILABLE FOR IMMEDIATE DISPATCH
            </span>
            <p className="font-data-mono text-2xl mt-1 text-on-surface">
              {totalAvailable} UNITS
            </p>
          </div>
          <div className="bg-surface-container-low p-5 border border-[#d9b25c]/10">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              LOW STOCK ALERTS
            </span>
            <p className="font-data-mono text-2xl text-[#d9b25c] mt-1">
              {rows.filter((r) => r.status === 'LOW STOCK').length} PIECES
            </p>
          </div>
        </section>

        {/* Inventory Table */}
        <section className="bg-surface-container-low p-6 space-y-4">
          <h2 className="font-headline-md text-lg uppercase">
            LIVE SKU STOCK &amp; SIZES
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-outline-variant/30 text-outline uppercase">
                  <th className="py-2.5">SKU</th>
                  <th className="py-2.5">Piece Name</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">Sizes Breakdown</th>
                  <th className="py-2.5">Total Stock</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {rows.map((row) => (
                  <tr key={row.productId}>
                    <td className="py-3 text-[#d9b25c]">{row.sku}</td>
                    <td className="py-3 font-bold text-on-surface">{row.name}</td>
                    <td className="py-3 uppercase text-outline">{row.category}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {row.sizes.map((sz) => (
                          <span
                            key={sz.size}
                            className="px-1.5 py-0.5 bg-surface-container text-[10px] text-on-surface"
                          >
                            {sz.size}: {sz.stock}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 font-bold">{row.totalStock}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-[#d9b25c]/20 text-[#d9b25c] text-[10px] uppercase">
                        {row.status}
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
