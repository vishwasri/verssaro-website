'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { ModalDialog } from '@/components/ModalDialog';
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
  london: number;
  dubai: number;
  reserved: number;
  available: number;
  status: string;
}

interface StockMovementRow {
  id: string;
  sku: string;
  garmentTitle: string;
  fromNode: string;
  toNode: string;
  quantity: number;
  movementType: string;
  initiatedBy: string;
  referenceCode: string;
  status: string;
  createdAt: string;
}

interface InventoryResponse {
  rows: InventoryRow[];
  movements: StockMovementRow[];
}

export default function AdminMultiVaultInventoryPage() {
  const { announce } = useStore();
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  const [productId, setProductId] = useState('');
  const [fromNode, setFromNode] = useState('Colombo Flagship');
  const [toNode, setToNode] = useState('London Mayfair Suite');
  const [quantity, setQuantity] = useState('2');
  const [size, setSize] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch<InventoryResponse>('/admin/inventory')
      .then((res) => {
        if (!active) return;
        setData(res);
        if (res.rows[0]) {
          setProductId((prev) => prev || res.rows[0].productId);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || fromNode === toNode) {
      announce('SELECT DISTINCT ORIGIN AND TARGET VAULT NODES', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch<{
        movement: StockMovementRow;
        inventory: InventoryResponse;
      }>('/admin/inventory/transfer', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          fromNode,
          toNode,
          quantity: Number(quantity),
          ...(size.trim() ? { size: size.trim().toUpperCase() } : {}),
        }),
      });
      setData(res.inventory);
      setTransferOpen(false);
      announce(
        `DISPATCHED INTER-VAULT MANIFEST ${res.movement.referenceCode}`,
      );
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'INTER-VAULT TRANSFER FAILED'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const rows = data?.rows ?? [];

  return (
    <AdminShell>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-data-mono text-[11px] text-primary-fixed uppercase tracking-[0.2em]">
              GLOBAL ALLOCATION // INTER-VAULT LEDGER
            </p>
            <h1 className="font-headline-lg text-2xl md:text-headline-lg uppercase mt-1">
              MULTI-VAULT INVENTORY MATRIX
            </h1>
          </div>

          <button
            className="bg-on-surface text-surface hover:bg-primary-fixed px-5 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest font-bold transition-colors"
            onClick={() => setTransferOpen(true)}
            type="button"
          >
            + TRANSFER BETWEEN VAULTS
          </button>
        </header>

        {/* Vault Node Totals */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              COLOMBO FLAGSHIP
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {rows.reduce((s, r) => s + r.colombo, 0)} UNITS
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              LONDON MAYFAIR SUITE
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {rows.reduce((s, r) => s + r.london, 0)} UNITS
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              DUBAI PRIVATE VAULT
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {rows.reduce((s, r) => s + r.dubai, 0)} UNITS
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              LOW STOCK ALERTS
            </span>
            <p className="font-data-mono text-2xl text-primary-fixed mt-1">
              {rows.filter((r) => r.status === 'LOW STOCK').length} SKUS
            </p>
          </div>
        </section>

        {/* Multi-Vault SKU Table */}
        <div className="bg-surface-container-low overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest font-label-caps-sm text-[10px] uppercase tracking-wider text-outline">
                <th className="p-4">SKU // GARMENT</th>
                <th className="p-4">COLOMBO</th>
                <th className="p-4">LONDON</th>
                <th className="p-4">DUBAI</th>
                <th className="p-4">RESERVED</th>
                <th className="p-4">AVAILABLE</th>
                <th className="p-4">HEALTH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-data-mono text-xs">
              {rows.map((r) => (
                <tr
                  className="hover:bg-surface-container transition-colors"
                  key={r.productId}
                >
                  <td className="p-4">
                    <p className="font-bold text-on-surface">{r.sku}</p>
                    <p className="text-[11px] text-outline uppercase">
                      {r.name}
                    </p>
                  </td>
                  <td className="p-4">{r.colombo}</td>
                  <td className="p-4">{r.london}</td>
                  <td className="p-4">{r.dubai}</td>
                  <td className="p-4 text-outline">{r.reserved}</td>
                  <td className="p-4 font-bold">{r.available}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-[10px] ${
                        r.status === 'LOW STOCK'
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-surface-container-highest text-primary-fixed'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Inter-Vault Stock Movements Log */}
        <section className="space-y-4">
          <h2 className="font-headline-md text-headline-md uppercase">
            RECENT STOCK MOVEMENT AUDIT ({data?.movements.length ?? 0})
          </h2>
          <div className="bg-surface-container-low overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest font-label-caps-sm text-[10px] uppercase tracking-wider text-outline">
                  <th className="p-4">REFERENCE</th>
                  <th className="p-4">GARMENT &amp; SKU</th>
                  <th className="p-4">ROUTING VECTOR</th>
                  <th className="p-4">QTY</th>
                  <th className="p-4">INITIATED BY</th>
                  <th className="p-4">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container font-data-mono text-xs">
                {(data?.movements ?? []).map((mv) => (
                  <tr
                    className="hover:bg-surface-container transition-colors"
                    key={mv.id}
                  >
                    <td className="p-4 font-bold">{mv.referenceCode}</td>
                    <td className="p-4">
                      <p className="uppercase">{mv.garmentTitle}</p>
                      <p className="text-[10px] text-outline">{mv.sku}</p>
                    </td>
                    <td className="p-4 text-primary-fixed">
                      {mv.fromNode} → {mv.toNode}
                    </td>
                    <td className="p-4 font-bold">{mv.quantity} UNITS</td>
                    <td className="p-4 text-outline">{mv.initiatedBy}</td>
                    <td className="p-4">{mv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Transfer Between Vaults Dialog */}
      <ModalDialog
        maxWidthClass="max-w-lg"
        onClose={() => setTransferOpen(false)}
        open={transferOpen}
        titleId="vault-transfer-title"
      >
        <form
          className="p-6 md:p-8 space-y-5"
          onSubmit={(e) => void handleTransfer(e)}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-data-mono text-[10px] text-primary-fixed uppercase">
                DHL AIR FREIGHT REBALANCING
              </p>
              <h2
                className="font-headline-md text-headline-md uppercase mt-1"
                id="vault-transfer-title"
              >
                TRANSFER STOCK BETWEEN VAULTS
              </h2>
            </div>
            <button
              aria-label="Close"
              onClick={() => setTransferOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="tr-sku"
              >
                GARMENT SKU
              </label>
              <select
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                id="tr-sku"
                onChange={(e) => setProductId(e.target.value)}
                value={productId}
              >
                {rows.map((r) => (
                  <option key={r.productId} value={r.productId}>
                    {r.sku} — {r.name} (CMB:{r.colombo} / LON:{r.london} / DXB:
                    {r.dubai})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                  htmlFor="tr-from"
                >
                  ORIGIN VAULT
                </label>
                <select
                  className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                  id="tr-from"
                  onChange={(e) => setFromNode(e.target.value)}
                  value={fromNode}
                >
                  <option value="Colombo Flagship">Colombo Flagship</option>
                  <option value="London Mayfair Suite">
                    London Mayfair Suite
                  </option>
                  <option value="Dubai Private Vault">
                    Dubai Private Vault
                  </option>
                </select>
              </div>
              <div>
                <label
                  className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                  htmlFor="tr-to"
                >
                  TARGET VAULT
                </label>
                <select
                  className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                  id="tr-to"
                  onChange={(e) => setToNode(e.target.value)}
                  value={toNode}
                >
                  <option value="Colombo Flagship">Colombo Flagship</option>
                  <option value="London Mayfair Suite">
                    London Mayfair Suite
                  </option>
                  <option value="Dubai Private Vault">
                    Dubai Private Vault
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                  htmlFor="tr-qty"
                >
                  UNITS TO REALLOCATE
                </label>
                <input
                  className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm"
                  id="tr-qty"
                  min="1"
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  type="number"
                  value={quantity}
                />
              </div>
              <div>
                <label
                  className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                  htmlFor="tr-size"
                >
                  SPECIFIC SIZE (OPTIONAL)
                </label>
                <input
                  className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                  id="tr-size"
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="ALL OR M/L/XL"
                  value={size}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 bg-on-surface text-surface hover:bg-primary-fixed py-3 font-label-caps-sm text-xs uppercase font-bold"
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'EXECUTING...' : 'AUTHORIZE VAULT TRANSFER'}
            </button>
            <button
              className="bg-surface-container-high px-4 py-3 font-label-caps-sm text-xs uppercase"
              onClick={() => setTransferOpen(false)}
              type="button"
            >
              CANCEL
            </button>
          </div>
        </form>
      </ModalDialog>
    </AdminShell>
  );
}
