'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { useStore } from '@/components/StoreContext';
import { apiFetch } from '@/lib/api';
import { VaultTransferReceipt } from '@/lib/types';

interface LedgerResponse {
  transfers: VaultTransferReceipt[];
  stats: {
    lifetimeHandoverTxs: number;
    secondaryRoyaltiesUsd: number;
    totalVolumeUsd: number;
    flaggedEvents: number;
    zkProofsVerified: number;
  };
}

export default function AdminProvenanceLedgerPage() {
  const { formatPrice, announce } = useStore();
  const [data, setData] = useState<LedgerResponse | null>(null);
  const [eventType, setEventType] = useState<'ALL' | 'MINT' | 'P2P'>('ALL');

  useEffect(() => {
    let active = true;
    apiFetch<LedgerResponse>(`/nfc/ledger?eventType=${eventType}`)
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [eventType]);

  const handleExportAuditJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verssaro-polygon-ledger-${eventType.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    announce('EXPORTED POLYGON AUDIT LEDGER JSON');
  };

  return (
    <AdminShell>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-data-mono text-[11px] text-primary-fixed uppercase tracking-[0.2em]">
              POLYGON POS ROLLUP // ZERO-KNOWLEDGE AUDIT
            </p>
            <h1 className="font-headline-lg text-2xl md:text-headline-lg uppercase mt-1">
              PROVENANCE LEDGER MONITOR
            </h1>
          </div>

          <button
            className="bg-surface-container-high hover:bg-surface-container-highest px-5 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors"
            onClick={handleExportAuditJson}
            type="button"
          >
            EXPORT AUDIT JSON
          </button>
        </header>

        {/* Stats KPI Row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              LIFETIME HANDOVER TXS
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {(data?.stats.lifetimeHandoverTxs ?? 1842).toLocaleString()}
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              5% SECONDARY ROYALTIES
            </span>
            <p className="font-data-mono text-2xl text-primary-fixed mt-1">
              {formatPrice(data?.stats.secondaryRoyaltiesUsd ?? 92400)}
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              ZK PROOFS VERIFIED
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {(data?.stats.zkProofsVerified ?? 6491).toLocaleString()}
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              COMPLIANCE / FLAGGED
            </span>
            <p className="font-data-mono text-2xl text-emerald-400 mt-1">
              {data?.stats.flaggedEvents ?? 0} FLAGGED
            </p>
          </div>
        </section>

        {/* Event Filter Tabs */}
        <div className="bg-surface-container-low p-4 flex flex-wrap gap-2">
          {(
            [
              ['ALL', 'ALL LEDGER EVENTS'],
              ['MINT', 'ATELIER PRIMARY MINTS'],
              ['P2P', 'PEER-TO-PEER HANDOVERS'],
            ] as const
          ).map(([key, label]) => (
            <button
              className={`px-4 py-2 font-label-caps-sm text-[11px] uppercase tracking-wider transition-colors ${
                eventType === key
                  ? 'bg-on-surface text-surface font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
              key={key}
              onClick={() => setEventType(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Immutable Transaction Stream */}
        <div className="bg-surface-container-low overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest font-label-caps-sm text-[10px] uppercase tracking-wider text-outline">
                <th className="p-4">RECEIPT // BLOCK</th>
                <th className="p-4">ARTIFACT GARMENT</th>
                <th className="p-4">CUSTODY TRANSITION</th>
                <th className="p-4">TX HASH</th>
                <th className="p-4">VALUATION</th>
                <th className="p-4">ROYALTY</th>
                <th className="p-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-data-mono text-xs">
              {(data?.transfers ?? []).map((tx) => (
                <tr
                  className="hover:bg-surface-container transition-colors"
                  key={tx.id}
                >
                  <td className="p-4">
                    <p className="font-bold text-on-surface">
                      {tx.receiptCode}
                    </p>
                    <p className="text-[10px] text-outline">
                      BLOCK #{tx.blockNumber}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="uppercase">
                      {tx.artifact?.garmentTitle || 'ARCHIVED PIECE'}
                    </p>
                    <p className="text-[10px] text-outline">
                      {tx.artifact?.uid || tx.artifactId}
                    </p>
                  </td>
                  <td className="p-4">
                    <p>
                      {tx.fromOwnerName} →{' '}
                      <span className="text-primary-fixed">{tx.toOwnerName}</span>
                    </p>
                    <p className="text-[10px] text-outline">
                      METHOD: {tx.transferMethod}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className="text-[11px] text-outline">
                      {tx.txHash.slice(0, 14)}...{tx.txHash.slice(-6)}
                    </span>
                  </td>
                  <td className="p-4">{formatPrice(tx.valuationUsd)}</td>
                  <td className="p-4 text-primary-fixed">
                    {formatPrice(tx.royaltyUsd)}
                  </td>
                  <td className="p-4">
                    <span className="bg-surface-container-highest px-2 py-1 text-[10px]">
                      {tx.status}
                    </span>
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
