'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { ModalDialog } from '@/components/ModalDialog';
import { useStore } from '@/components/StoreContext';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { NfcArtifact, Product } from '@/lib/types';

interface AdminNfcInventoryResponse {
  artifacts: NfcArtifact[];
  summary: {
    total: number;
    activeBound: number;
    pendingSeeding: number;
    inTransit: number;
  };
}

export default function AdminNfcInventoryPage() {
  const { announce } = useStore();
  const [data, setData] = useState<AdminNfcInventoryResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  // Batch Mint Modal
  const [mintOpen, setMintOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [mintCount, setMintCount] = useState('2');
  const [warehouseNode, setWarehouseNode] = useState('Colombo Flagship');
  const [minting, setMinting] = useState(false);

  const loadInventory = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('status', statusFilter);
    if (query.trim()) params.set('q', query.trim());
    try {
      const res = await apiFetch<AdminNfcInventoryResponse>(
        `/nfc/admin/inventory?${params.toString()}`,
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
    apiFetch<AdminNfcInventoryResponse>(
      `/nfc/admin/inventory?${params.toString()}`,
    )
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [statusFilter, query]);

  useEffect(() => {
    apiFetch<{ items: Product[] }>('/products')
      .then((res) => {
        setProducts(res.items || []);
        if (res.items?.[0]) setSelectedProductId(res.items[0].id);
      })
      .catch(() => {});
  }, []);

  const handleChipAction = async (
    id: string,
    action: 'RESYNC' | 'ACTIVATE' | 'BURN',
  ) => {
    try {
      await apiFetch(`/nfc/admin/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      await loadInventory();
      announce(`CHIP ACTION EXECUTED // ${action}`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'CHIP ACTION FAILED'), 'error');
    }
  };

  const handleBatchMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setMinting(true);
    try {
      const res = await apiFetch<{ mintedCount: number }>(
        '/nfc/admin/batch-mint',
        {
          method: 'POST',
          body: JSON.stringify({
            productId: selectedProductId,
            count: Number(mintCount),
            warehouseNode,
          }),
        },
      );
      await loadInventory();
      setMintOpen(false);
      announce(`BATCH MINTED ${res.mintedCount} NTAG 424 SILICON TAGS`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'BATCH MINT FAILED'), 'error');
    } finally {
      setMinting(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-data-mono text-[11px] text-primary-fixed uppercase tracking-[0.2em]">
              NTAG 424 DNA // HARDWARE PROVISIONING
            </p>
            <h1 className="font-headline-lg text-2xl md:text-headline-lg uppercase mt-1">
              GARMENT ARCHIVE &amp; NFC INVENTORY
            </h1>
          </div>

          <button
            className="bg-on-surface text-surface hover:bg-primary-fixed px-5 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest font-bold transition-colors"
            onClick={() => setMintOpen(true)}
            type="button"
          >
            + BATCH MINT SILICON TAGS
          </button>
        </header>

        {/* Summary Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              TOTAL SILICON REGISTRY
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {data?.summary.total ?? 0}
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              ACTIVE BOUND CUSTODY
            </span>
            <p className="font-data-mono text-2xl text-primary-fixed mt-1">
              {data?.summary.activeBound ?? 0}
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              PENDING SEEDING
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {data?.summary.pendingSeeding ?? 0}
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              IN TRANSIT / ESCROW
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {data?.summary.inTransit ?? 0}
            </p>
          </div>
        </section>

        {/* Filters */}
        <div className="bg-surface-container-low p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              'ALL',
              'ACTIVE_BOUND',
              'PENDING_SEEDING',
              'IN_TRANSIT',
              'BURNED',
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
            aria-label="Search chip UID, tag label, or garment"
            className="bg-surface-container-highest px-4 py-2 font-data-mono text-xs text-on-surface placeholder:text-outline focus:outline-none min-w-64"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH UID OR SKU..."
            value={query}
          />
        </div>

        {/* Silicon Registry Table */}
        <div className="bg-surface-container-low overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest font-label-caps-sm text-[10px] uppercase tracking-wider text-outline">
                <th className="p-4">TAG SERIAL // UID</th>
                <th className="p-4">GARMENT &amp; SKU</th>
                <th className="p-4">CUSTODIAN</th>
                <th className="p-4">VAULT NODE</th>
                <th className="p-4">STATE</th>
                <th className="p-4 text-right">TELEMETRY ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-data-mono text-xs">
              {(data?.artifacts ?? []).map((chip) => (
                <tr
                  className="hover:bg-surface-container transition-colors"
                  key={chip.id}
                >
                  <td className="p-4">
                    <p className="font-bold text-primary-fixed">
                      {chip.tagLabel}
                    </p>
                    <p className="text-[10px] text-outline">{chip.uid}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-on-surface uppercase">
                      {chip.garmentTitle}
                    </p>
                    <p className="text-[10px] text-outline">
                      {chip.sku} {'//'} {chip.tokenId}
                    </p>
                  </td>
                  <td className="p-4">
                    {chip.ownerUser ? (
                      <>
                        <p>{chip.ownerUser.name}</p>
                        <p className="text-[10px] text-outline">
                          {chip.ownerUser.walletAddress}
                        </p>
                      </>
                    ) : (
                      <span className="text-outline">ATELIER UNCLAIMED</span>
                    )}
                  </td>
                  <td className="p-4">{chip.warehouseNode}</td>
                  <td className="p-4">
                    <span className="bg-surface-container-highest px-2 py-1 text-[10px]">
                      {chip.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      className="bg-surface-container-high hover:bg-on-surface hover:text-surface px-2.5 py-1 text-[10px] uppercase"
                      onClick={() => void handleChipAction(chip.id, 'RESYNC')}
                      type="button"
                    >
                      RESYNC
                    </button>
                    <button
                      className="bg-surface-container-high hover:bg-primary-fixed hover:text-surface px-2.5 py-1 text-[10px] uppercase"
                      onClick={() => void handleChipAction(chip.id, 'ACTIVATE')}
                      type="button"
                    >
                      ACTIVATE
                    </button>
                    <button
                      className="bg-surface-container-high hover:bg-error-container hover:text-on-error-container px-2.5 py-1 text-[10px] uppercase"
                      onClick={() => void handleChipAction(chip.id, 'BURN')}
                      type="button"
                    >
                      BURN
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Mint Silicon Dialog */}
      <ModalDialog
        maxWidthClass="max-w-lg"
        onClose={() => setMintOpen(false)}
        open={mintOpen}
        titleId="batch-mint-title"
      >
        <form
          className="p-6 md:p-8 space-y-5"
          onSubmit={(e) => void handleBatchMint(e)}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-data-mono text-[10px] text-primary-fixed uppercase">
                NXP NTAG 424 ENCRYPTION
              </p>
              <h2
                className="font-headline-md text-headline-md uppercase mt-1"
                id="batch-mint-title"
              >
                BATCH MINT SILICON TAGS
              </h2>
            </div>
            <button
              aria-label="Close"
              onClick={() => setMintOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="mint-prod"
              >
                TARGET GARMENT SKU
              </label>
              <select
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                id="mint-prod"
                onChange={(e) => setSelectedProductId(e.target.value)}
                value={selectedProductId}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                  htmlFor="mint-qty"
                >
                  TAG COUNT (1–20)
                </label>
                <input
                  className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm"
                  id="mint-qty"
                  max="20"
                  min="1"
                  onChange={(e) => setMintCount(e.target.value)}
                  required
                  type="number"
                  value={mintCount}
                />
              </div>

              <div>
                <label
                  className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                  htmlFor="mint-node"
                >
                  WAREHOUSE SEED NODE
                </label>
                <select
                  className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                  id="mint-node"
                  onChange={(e) => setWarehouseNode(e.target.value)}
                  value={warehouseNode}
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
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 bg-on-surface text-surface hover:bg-primary-fixed py-3 font-label-caps-sm text-xs uppercase font-bold"
              disabled={minting}
              type="submit"
            >
              {minting ? 'SEEDING CHIPS...' : 'GENERATE SILICON PROOFS'}
            </button>
            <button
              className="bg-surface-container-high px-4 py-3 font-label-caps-sm text-xs uppercase"
              onClick={() => setMintOpen(false)}
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
