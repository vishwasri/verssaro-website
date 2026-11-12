'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { ModalDialog } from '@/components/ModalDialog';
import { useStore } from '@/components/StoreContext';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { UserDossier } from '@/lib/types';

interface AdminClientRow extends UserDossier {
  piecesCount: number;
  ordersCount: number;
}

interface AdminClientsResponse {
  clients: AdminClientRow[];
  summary: {
    totalClients: number;
    tier01Count: number;
    tier02Count: number;
    avgLtvUsd: number;
    activePasses: number;
  };
}

export default function AdminClientsVipPage() {
  const { formatPrice, announce } = useStore();
  const [data, setData] = useState<AdminClientsResponse | null>(null);
  const [tierFilter, setTierFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  // Onboard VIP Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTier, setNewTier] = useState('TIER 02 // SOVEREIGN VERIFIED');
  const [newHub, setNewHub] = useState('COLOMBO FLAGSHIP #01');
  const [newLiaison, setNewLiaison] = useState('SARA K.');

  // Edit VIP Modal
  const [editingClient, setEditingClient] = useState<AdminClientRow | null>(
    null,
  );
  const [editTier, setEditTier] = useState('');
  const [editKyc, setEditKyc] = useState('');
  const [editPasses, setEditPasses] = useState('3');
  const [editNotes, setEditNotes] = useState('');

  const loadClients = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('tier', tierFilter);
    if (query.trim()) params.set('q', query.trim());
    try {
      const res = await apiFetch<AdminClientsResponse>(
        `/admin/clients?${params.toString()}`,
      );
      setData(res);
    } catch {
      // handled gracefully
    }
  }, [tierFilter, query]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    params.set('tier', tierFilter);
    if (query.trim()) params.set('q', query.trim());
    apiFetch<AdminClientsResponse>(`/admin/clients?${params.toString()}`)
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [tierFilter, query]);

  const handleOnboardVip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          tier: newTier,
          atelierHub: newHub,
          liaisonName: newLiaison,
        }),
      });
      await loadClients();
      setCreateOpen(false);
      setNewName('');
      setNewEmail('');
      announce(`ONBOARDED NEW VIP DOSSIER // ${newName.toUpperCase()}`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'UNABLE TO ONBOARD VIP'), 'error');
    }
  };

  const openEditClient = (c: AdminClientRow) => {
    setEditingClient(c);
    setEditTier(c.tier);
    setEditKyc(c.kycStatus);
    setEditPasses(String(c.restorationPassesRemaining));
    setEditNotes(c.liaisonNotes || '');
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      await apiFetch(`/admin/clients/${editingClient.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          tier: editTier,
          kycStatus: editKyc,
          restorationPassesRemaining: Number(editPasses),
          liaisonNotes: editNotes,
        }),
      });
      await loadClients();
      setEditingClient(null);
      announce(`UPDATED DOSSIER // ${editingClient.dossierCode}`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'UPDATE FAILED'), 'error');
    }
  };

  return (
    <AdminShell>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-data-mono text-[11px] text-primary-fixed uppercase tracking-[0.2em]">
              PRIVATE PATRON REGISTRY // TIER 01–02
            </p>
            <h1 className="font-headline-lg text-2xl md:text-headline-lg uppercase mt-1">
              CLIENT DOSSIERS &amp; VIP MANAGEMENT
            </h1>
          </div>

          <button
            className="bg-on-surface text-surface hover:bg-primary-fixed px-5 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest font-bold transition-colors"
            onClick={() => setCreateOpen(true)}
            type="button"
          >
            + ONBOARD VIP CLIENT
          </button>
        </header>

        {/* Summary Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              TOTAL REGISTRY
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {data?.summary.totalClients ?? 482}
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              TIER 01 SOVEREIGN
            </span>
            <p className="font-data-mono text-2xl text-primary-fixed mt-1">
              {data?.summary.tier01Count ?? 24}
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              TIER 02 VERIFIED
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {data?.summary.tier02Count ?? 118}
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              AVERAGE LTV
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {formatPrice(data?.summary.avgLtvUsd ?? 6840)}
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              ACTIVE CARE PASSES
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {data?.summary.activePasses ?? 180}
            </p>
          </div>
        </section>

        {/* Filters */}
        <div className="bg-surface-container-low p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['ALL', 'ALL PATRONS'],
                ['TIER_01', 'TIER 01'],
                ['TIER_02', 'TIER 02'],
                ['KYC_PENDING', 'KYC PENDING'],
              ] as const
            ).map(([k, label]) => (
              <button
                className={`px-3.5 py-2 font-label-caps-sm text-[11px] uppercase tracking-wider transition-colors ${
                  tierFilter === k
                    ? 'bg-on-surface text-surface font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
                key={k}
                onClick={() => setTierFilter(k)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          <input
            aria-label="Search patron name, dossier code or wallet"
            className="bg-surface-container-highest px-4 py-2 font-data-mono text-xs text-on-surface placeholder:text-outline focus:outline-none min-w-64"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH DOSSIER OR WALLET..."
            value={query}
          />
        </div>

        {/* Client Dossier Table */}
        <div className="bg-surface-container-low overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest font-label-caps-sm text-[10px] uppercase tracking-wider text-outline">
                <th className="p-4">DOSSIER // PATRON</th>
                <th className="p-4">TIER &amp; KYC</th>
                <th className="p-4">WALLET // HUB</th>
                <th className="p-4">PIECES // SPEND</th>
                <th className="p-4">CARE PASSES</th>
                <th className="p-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-data-mono text-xs">
              {(data?.clients ?? []).map((c) => (
                <tr
                  className="hover:bg-surface-container transition-colors"
                  key={c.id}
                >
                  <td className="p-4">
                    <p className="font-bold text-on-surface uppercase">
                      {c.name}
                    </p>
                    <p className="text-[10px] text-primary-fixed">
                      {c.dossierCode} {'//'} {c.email}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-[11px]">{c.tier}</p>
                    <p className="text-[10px] text-outline">
                      KYC: {c.kycStatus}
                    </p>
                  </td>
                  <td className="p-4">
                    <p>{c.walletAddress}</p>
                    <p className="text-[10px] text-outline">{c.atelierHub}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold">{formatPrice(c.totalSpendUsd)}</p>
                    <p className="text-[10px] text-outline">
                      {c.piecesCount} NFC // {c.ordersCount} ORDERS
                    </p>
                  </td>
                  <td className="p-4">
                    {c.restorationPassesRemaining} / {c.restorationPassesTotal}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      className="bg-surface-container-high hover:bg-on-surface hover:text-surface px-3 py-1.5 text-[10px] uppercase transition-colors"
                      onClick={() => openEditClient(c)}
                      type="button"
                    >
                      INSPECT / EDIT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard VIP Client Dialog */}
      <ModalDialog
        maxWidthClass="max-w-lg"
        onClose={() => setCreateOpen(false)}
        open={createOpen}
        titleId="onboard-vip-title"
      >
        <form
          className="p-6 md:p-8 space-y-5"
          onSubmit={(e) => void handleOnboardVip(e)}
        >
          <div className="flex justify-between items-start">
            <h2
              className="font-headline-md text-headline-md uppercase"
              id="onboard-vip-title"
            >
              ONBOARD PRIVATE VIP CLIENT
            </h2>
            <button
              aria-label="Close"
              onClick={() => setCreateOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="vip-name"
              >
                CLIENT FULL NAME *
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm"
                id="vip-name"
                onChange={(e) => setNewName(e.target.value)}
                required
                value={newName}
              />
            </div>

            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="vip-email"
              >
                CLIENT EMAIL *
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm"
                id="vip-email"
                onChange={(e) => setNewEmail(e.target.value)}
                required
                type="email"
                value={newEmail}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                  htmlFor="vip-tier"
                >
                  TIER CLASSIFICATION
                </label>
                <select
                  className="w-full bg-surface-container-highest px-3 py-3 font-data-mono text-xs"
                  id="vip-tier"
                  onChange={(e) => setNewTier(e.target.value)}
                  value={newTier}
                >
                  <option value="TIER 01 // SOVEREIGN ARCHIVE">
                    TIER 01 SOVEREIGN
                  </option>
                  <option value="TIER 02 // SOVEREIGN VERIFIED">
                    TIER 02 VERIFIED
                  </option>
                </select>
              </div>
              <div>
                <label
                  className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                  htmlFor="vip-liaison"
                >
                  LIAISON OFFICER
                </label>
                <input
                  className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                  id="vip-liaison"
                  onChange={(e) => setNewLiaison(e.target.value)}
                  value={newLiaison}
                />
              </div>
            </div>

            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="vip-hub"
              >
                HOME ATELIER HUB
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                id="vip-hub"
                onChange={(e) => setNewHub(e.target.value)}
                value={newHub}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 bg-on-surface text-surface hover:bg-primary-fixed py-3 font-label-caps-sm text-xs uppercase font-bold"
              type="submit"
            >
              ISSUE DOSSIER &amp; WALLET
            </button>
            <button
              className="bg-surface-container-high px-4 py-3 font-label-caps-sm text-xs uppercase"
              onClick={() => setCreateOpen(false)}
              type="button"
            >
              CANCEL
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Edit VIP Dossier Dialog */}
      <ModalDialog
        maxWidthClass="max-w-lg"
        onClose={() => setEditingClient(null)}
        open={Boolean(editingClient)}
        titleId="edit-vip-title"
      >
        {editingClient ? (
          <form
            className="p-6 md:p-8 space-y-5"
            onSubmit={(e) => void handleUpdateClient(e)}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-data-mono text-[10px] text-primary-fixed uppercase">
                  {editingClient.dossierCode}
                </p>
                <h2
                  className="font-headline-md text-headline-md uppercase mt-1"
                  id="edit-vip-title"
                >
                  {editingClient.name}
                </h2>
              </div>
              <button
                aria-label="Close"
                onClick={() => setEditingClient(null)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                  htmlFor="edit-c-tier"
                >
                  TIER CLASSIFICATION
                </label>
                <input
                  className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                  id="edit-c-tier"
                  onChange={(e) => setEditTier(e.target.value)}
                  value={editTier}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                    htmlFor="edit-c-kyc"
                  >
                    KYC VERIFICATION
                  </label>
                  <select
                    className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                    id="edit-c-kyc"
                    onChange={(e) => setEditKyc(e.target.value)}
                    value={editKyc}
                  >
                    <option value="VERIFIED_TIER_01">VERIFIED_TIER_01</option>
                    <option value="VERIFIED_TIER_02">VERIFIED_TIER_02</option>
                    <option value="KYC_PENDING">KYC_PENDING</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                    htmlFor="edit-c-passes"
                  >
                    RESTORATION PASSES LEFT
                  </label>
                  <input
                    className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm"
                    id="edit-c-passes"
                    min="0"
                    onChange={(e) => setEditPasses(e.target.value)}
                    type="number"
                    value={editPasses}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                  htmlFor="edit-c-notes"
                >
                  LIAISON CONCIERGE NOTES
                </label>
                <textarea
                  className="w-full bg-surface-container-highest px-4 py-3 font-body-sm text-xs min-h-20"
                  id="edit-c-notes"
                  onChange={(e) => setEditNotes(e.target.value)}
                  value={editNotes}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 bg-on-surface text-surface hover:bg-primary-fixed py-3 font-label-caps-sm text-xs uppercase font-bold"
                type="submit"
              >
                UPDATE VIP DOSSIER
              </button>
              <button
                className="bg-surface-container-high px-4 py-3 font-label-caps-sm text-xs uppercase"
                onClick={() => setEditingClient(null)}
                type="button"
              >
                CANCEL
              </button>
            </div>
          </form>
        ) : null}
      </ModalDialog>
    </AdminShell>
  );
}
