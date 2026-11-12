'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { useStore } from '@/components/StoreContext';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { Order } from '@/lib/types';

interface AdminOrdersResponse {
  orders: Order[];
  counts: {
    all: number;
    unfulfilled: number;
    processingQc: number;
    dispatched: number;
    delivered: number;
    hold: number;
  };
}

export default function AdminOrdersFulfillmentPage() {
  const { formatPrice, announce } = useStore();
  const [data, setData] = useState<AdminOrdersResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [dispatching, setDispatching] = useState(false);

  const loadOrders = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('status', statusFilter);
    if (query.trim()) params.set('q', query.trim());
    try {
      const res = await apiFetch<AdminOrdersResponse>(
        `/orders/admin?${params.toString()}`,
      );
      setData(res);
    } catch {
      // handled cleanly
    }
  }, [statusFilter, query]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    params.set('status', statusFilter);
    if (query.trim()) params.set('q', query.trim());
    apiFetch<AdminOrdersResponse>(`/orders/admin?${params.toString()}`)
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [statusFilter, query]);

  const handleBulkDispatch = async () => {
    setDispatching(true);
    try {
      const res = await apiFetch<{ dispatchedCount: number }>(
        '/orders/admin/bulk-dispatch',
        { method: 'POST' },
      );
      await loadOrders();
      announce(`DISPATCHED ${res.dispatchedCount} QUEUED ORDERS TO DHL`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'BULK DISPATCH FAILED'), 'error');
    } finally {
      setDispatching(false);
    }
  };

  const handleOrderStatusChange = async (id: string, status: string) => {
    try {
      await apiFetch(`/orders/admin/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadOrders();
      announce(`ORDER UPDATED TO ${status}`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'STATUS UPDATE FAILED'), 'error');
    }
  };

  const exportCsv = () => {
    const orders = data?.orders ?? [];
    const lines = [
      'ORDER_NUMBER,CUSTOMER,DESTINATION,CARRIER,WAYBILL,TOTAL_USD,STATUS',
      ...orders.map(
        (o) =>
          `${o.orderNumber},"${o.customerName}",${o.destinationCode},"${o.carrierName}",${o.trackingNumber},${o.totalUsd},${o.status}`,
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'verssaro-fulfillment-manifest.csv';
    a.click();
    URL.revokeObjectURL(url);
    announce('EXPORTED DISPATCH MANIFEST CSV');
  };

  return (
    <AdminShell>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-data-mono text-[11px] text-primary-fixed uppercase tracking-[0.2em]">
              COLOMBO // LONDON // DUBAI LOGISTICS
            </p>
            <h1 className="font-headline-lg text-2xl md:text-headline-lg uppercase mt-1">
              ORDERS &amp; FULFILLMENT DISPATCH
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="bg-surface-container-high hover:bg-surface-container-highest px-4 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors"
              onClick={exportCsv}
              type="button"
            >
              EXPORT MANIFEST CSV
            </button>
            <button
              className="bg-on-surface text-surface hover:bg-primary-fixed px-5 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest font-bold transition-colors disabled:opacity-50"
              disabled={dispatching}
              onClick={() => void handleBulkDispatch()}
              type="button"
            >
              {dispatching ? 'DISPATCHING...' : 'DISPATCH QUEUED BATCH'}
            </button>
          </div>
        </header>

        {/* Counts HUD */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            ['ALL ORDERS', data?.counts.all ?? 0],
            ['UNFULFILLED', data?.counts.unfulfilled ?? 0],
            ['PROCESSING QC', data?.counts.processingQc ?? 0],
            ['DISPATCHED', data?.counts.dispatched ?? 0],
            ['DELIVERED', data?.counts.delivered ?? 0],
            ['COMPLIANCE HOLD', data?.counts.hold ?? 0],
          ].map(([label, val]) => (
            <div className="bg-surface-container-low p-4 space-y-1" key={label}>
              <span className="font-label-caps-sm text-[10px] uppercase text-outline">
                {label}
              </span>
              <p className="font-data-mono text-2xl">{val}</p>
            </div>
          ))}
        </section>

        {/* Filters */}
        <div className="bg-surface-container-low p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              'ALL',
              'UNFULFILLED',
              'PROCESSING_QC',
              'DISPATCHED',
              'DELIVERED',
              'HOLD',
            ].map((st) => (
              <button
                className={`px-3.5 py-2 font-label-caps-sm text-[11px] uppercase tracking-wider transition-colors ${
                  statusFilter === st
                    ? 'bg-on-surface text-surface font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
                key={st}
                onClick={() => setStatusFilter(st)}
                type="button"
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <input
            aria-label="Search order number, patron or waybill"
            className="bg-surface-container-highest px-4 py-2 font-data-mono text-xs text-on-surface placeholder:text-outline focus:outline-none min-w-64"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH ORDER, PATRON OR WAYBILL..."
            value={query}
          />
        </div>

        {/* Orders Stream Table */}
        <div className="bg-surface-container-low overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest font-label-caps-sm text-[10px] uppercase tracking-wider text-outline">
                <th className="p-4">ORDER #</th>
                <th className="p-4">PATRON &amp; DESTINATION</th>
                <th className="p-4">PIECES</th>
                <th className="p-4">CARRIER &amp; WAYBILL</th>
                <th className="p-4">TOTAL</th>
                <th className="p-4">DISPATCH STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-data-mono text-xs">
              {(data?.orders ?? []).map((o) => (
                <tr
                  className="hover:bg-surface-container transition-colors"
                  key={o.id}
                >
                  <td className="p-4">
                    <p className="font-bold text-on-surface">{o.orderNumber}</p>
                    <p className="text-[10px] text-outline">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-on-surface uppercase">
                      {o.customerName}
                    </p>
                    <p className="text-[10px] text-primary-fixed">
                      {o.destinationCode}
                    </p>
                  </td>
                  <td className="p-4">
                    {o.items.length} LINE ITEM(S)
                    <p className="text-[10px] text-outline truncate max-w-48">
                      {o.items.map((i) => i.name).join(', ')}
                    </p>
                  </td>
                  <td className="p-4">
                    <p>{o.carrierName}</p>
                    <p className="text-[10px] text-outline">
                      {o.trackingNumber}
                    </p>
                  </td>
                  <td className="p-4 font-bold">{formatPrice(o.totalUsd)}</td>
                  <td className="p-4">
                    <select
                      aria-label={`Fulfillment status for ${o.orderNumber}`}
                      className="bg-surface-container-highest px-3 py-1.5 font-data-mono text-[11px] uppercase focus:outline-none"
                      onChange={(e) =>
                        void handleOrderStatusChange(o.id, e.target.value)
                      }
                      value={o.status}
                    >
                      <option value="UNFULFILLED">UNFULFILLED</option>
                      <option value="PROCESSING_QC">PROCESSING QC</option>
                      <option value="DISPATCHED">DISPATCHED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="HOLD">HOLD</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
