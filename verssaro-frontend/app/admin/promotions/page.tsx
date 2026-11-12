'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { ModalDialog } from '@/components/ModalDialog';
import { useStore } from '@/components/StoreContext';
import { apiFetch, getErrorMessage } from '@/lib/api';

interface PromoRow {
  id: string;
  code: string;
  name: string;
  description: string;
  campaignType: string;
  discountType: string;
  discountValue: number;
  minSubtotalUsd: number;
  gateTarget: string;
  claimsUsed: number;
  attributedRevUsd: number;
  status: 'LIVE' | 'SCHEDULED' | 'ARCHIVED';
}

interface AdminPromotionsResponse {
  promotions: PromoRow[];
  summary: {
    activeCount: number;
    totalCount: number;
    attributedRevUsd: number;
    claimsUsed: number;
  };
}

export default function AdminPromotionsEnginePage() {
  const { formatPrice, announce } = useStore();
  const [data, setData] = useState<AdminPromotionsResponse | null>(null);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  // Deploy New Campaign modal
  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState('ATELIER-02');
  const [name, setName] = useState('Archive 02 Whitelist Allocation');
  const [description, setDescription] = useState(
    'Private early access incentive for sovereign wallet holders.',
  );
  const [campaignType, setCampaignType] = useState<
    'VIP_WHITELIST' | 'TIERED_BASKET' | 'CONCIERGE' | 'STANDARD'
  >('VIP_WHITELIST');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>(
    'PERCENT',
  );
  const [discountValue, setDiscountValue] = useState('15');
  const [minSubtotalUsd, setMinSubtotalUsd] = useState('0');
  const [gateTarget, setGateTarget] = useState('Tier 01 Sovereign Wallets');

  const loadPromos = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('type', typeFilter);
    if (query.trim()) params.set('q', query.trim());
    try {
      const res = await apiFetch<AdminPromotionsResponse>(
        `/admin/promotions?${params.toString()}`,
      );
      setData(res);
    } catch {
      // handled cleanly
    }
  }, [typeFilter, query]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    params.set('type', typeFilter);
    if (query.trim()) params.set('q', query.trim());
    apiFetch<AdminPromotionsResponse>(`/admin/promotions?${params.toString()}`)
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [typeFilter, query]);

  const handleToggleStatus = async (promo: PromoRow) => {
    const next = promo.status === 'LIVE' ? 'ARCHIVED' : 'LIVE';
    try {
      await apiFetch(`/admin/promotions/${promo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      await loadPromos();
      announce(`CAMPAIGN ${promo.code} SET TO ${next}`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'UNABLE TO UPDATE CAMPAIGN'), 'error');
    }
  };

  const handleDeployCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/promotions', {
        method: 'POST',
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim(),
          campaignType,
          discountType,
          discountValue: Number(discountValue),
          minSubtotalUsd: Number(minSubtotalUsd || 0),
          gateTarget: gateTarget.trim(),
        }),
      });
      await loadPromos();
      setCreateOpen(false);
      announce(`DEPLOYED CAMPAIGN // ${code.trim().toUpperCase()}`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'FAILED TO CREATE CAMPAIGN'), 'error');
    }
  };

  return (
    <AdminShell>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-data-mono text-[11px] text-primary-fixed uppercase tracking-[0.2em]">
              WHITELIST GATING &amp; PRIVATE INCENTIVES
            </p>
            <h1 className="font-headline-lg text-2xl md:text-headline-lg uppercase mt-1">
              PROMOTIONS &amp; VIP ACCESS ENGINE
            </h1>
          </div>

          <button
            className="bg-on-surface text-surface hover:bg-primary-fixed px-5 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest font-bold transition-colors"
            onClick={() => setCreateOpen(true)}
            type="button"
          >
            + DEPLOY NEW CAMPAIGN
          </button>
        </header>

        {/* Summary Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              LIVE ACTIVE KEYS
            </span>
            <p className="font-data-mono text-2xl text-primary-fixed mt-1">
              {data?.summary.activeCount ?? 0} /{' '}
              {data?.summary.totalCount ?? 0}
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              ATTRIBUTED REVENUE
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {formatPrice(data?.summary.attributedRevUsd ?? 0)}
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              TOTAL CLAIMS EXECUTED
            </span>
            <p className="font-data-mono text-2xl mt-1">
              {data?.summary.claimsUsed ?? 0}
            </p>
          </div>
          <div className="bg-surface-container-low p-5">
            <span className="font-label-caps-sm text-[10px] text-outline uppercase">
              CHECKOUT VALIDATOR
            </span>
            <p className="font-data-mono text-sm text-emerald-400 mt-2">
              REAL-TIME SYNCED
            </p>
          </div>
        </section>

        {/* Filters */}
        <div className="bg-surface-container-low p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              'ALL',
              'VIP_WHITELIST',
              'TIERED_BASKET',
              'CONCIERGE',
              'STANDARD',
            ].map((t) => (
              <button
                className={`px-3.5 py-2 font-label-caps-sm text-[11px] uppercase tracking-wider transition-colors ${
                  typeFilter === t
                    ? 'bg-on-surface text-surface font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
                key={t}
                onClick={() => setTypeFilter(t)}
                type="button"
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>

          <input
            aria-label="Search promo code or campaign name"
            className="bg-surface-container-highest px-4 py-2 font-data-mono text-xs text-on-surface placeholder:text-outline focus:outline-none min-w-64"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH CODE OR CAMPAIGN..."
            value={query}
          />
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(data?.promotions ?? []).map((promo) => (
            <article
              className="bg-surface-container-low p-6 flex flex-col justify-between gap-5"
              key={promo.id}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="bg-on-surface text-surface px-2.5 py-1 font-data-mono text-xs font-bold tracking-wider">
                      {promo.code}
                    </span>
                    <h2 className="font-headline-md text-lg uppercase mt-2">
                      {promo.name}
                    </h2>
                  </div>
                  <span
                    className={`px-2.5 py-1 font-data-mono text-[10px] uppercase ${
                      promo.status === 'LIVE'
                        ? 'bg-surface-container-highest text-primary-fixed'
                        : 'bg-surface-container text-outline'
                    }`}
                  >
                    {promo.status}
                  </span>
                </div>

                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {promo.description}
                </p>

                <dl className="grid grid-cols-3 gap-3 bg-surface-container p-3.5 font-data-mono text-xs">
                  <div>
                    <dt className="text-outline text-[10px]">INCENTIVE</dt>
                    <dd className="text-primary-fixed font-bold mt-0.5">
                      {promo.discountType === 'PERCENT'
                        ? `${promo.discountValue}% OFF`
                        : `${formatPrice(promo.discountValue)} OFF`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-outline text-[10px]">MIN BASKET</dt>
                    <dd className="mt-0.5">
                      {promo.minSubtotalUsd > 0
                        ? formatPrice(promo.minSubtotalUsd)
                        : 'NONE'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-outline text-[10px]">CLAIMS // REV</dt>
                    <dd className="mt-0.5">
                      {promo.claimsUsed} {'//'}{' '}
                      {formatPrice(promo.attributedRevUsd)}
                    </dd>
                  </div>
                </dl>

                <p className="font-data-mono text-[10px] text-outline uppercase">
                  GATE: {promo.gateTarget} {'//'} TYPE: {promo.campaignType}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  className="bg-surface-container-high hover:bg-on-surface hover:text-surface px-4 py-2 font-label-caps-sm text-[11px] uppercase tracking-wider transition-colors"
                  onClick={() => void handleToggleStatus(promo)}
                  type="button"
                >
                  {promo.status === 'LIVE' ? 'ARCHIVE CAMPAIGN' : 'ACTIVATE LIVE'}
                </button>
                <button
                  className="font-data-mono text-[11px] text-primary-fixed hover:underline uppercase"
                  onClick={() => {
                    if (
                      typeof navigator !== 'undefined' &&
                      navigator.clipboard
                    ) {
                      void navigator.clipboard.writeText(promo.code);
                    }
                    announce(`COPIED KEY ${promo.code}`);
                  }}
                  type="button"
                >
                  COPY PROMO KEY
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Deploy New Campaign Dialog */}
      <ModalDialog
        maxWidthClass="max-w-xl"
        onClose={() => setCreateOpen(false)}
        open={createOpen}
        titleId="deploy-promo-title"
      >
        <form
          className="p-6 md:p-8 space-y-5"
          onSubmit={(e) => void handleDeployCampaign(e)}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-data-mono text-[10px] text-primary-fixed uppercase">
                SOVEREIGN INCENTIVE PROTOCOL
              </p>
              <h2
                className="font-headline-md text-headline-md uppercase mt-1"
                id="deploy-promo-title"
              >
                DEPLOY NEW CAMPAIGN
              </h2>
            </div>
            <button
              aria-label="Close"
              onClick={() => setCreateOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="pr-code"
              >
                KEY / PROMO CODE *
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm uppercase"
                id="pr-code"
                onChange={(e) => setCode(e.target.value)}
                required
                value={code}
              />
            </div>
            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="pr-type"
              >
                CAMPAIGN CLASSIFICATION
              </label>
              <select
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                id="pr-type"
                onChange={(e) =>
                  setCampaignType(e.target.value as typeof campaignType)
                }
                value={campaignType}
              >
                <option value="VIP_WHITELIST">VIP WHITELIST</option>
                <option value="TIERED_BASKET">TIERED BASKET</option>
                <option value="CONCIERGE">CONCIERGE</option>
                <option value="STANDARD">STANDARD</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="pr-name"
              >
                CAMPAIGN HEADLINE *
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm"
                id="pr-name"
                onChange={(e) => setName(e.target.value)}
                required
                value={name}
              />
            </div>

            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="pr-dtype"
              >
                DISCOUNT UNIT
              </label>
              <select
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                id="pr-dtype"
                onChange={(e) =>
                  setDiscountType(e.target.value as typeof discountType)
                }
                value={discountType}
              >
                <option value="PERCENT">PERCENTAGE (%)</option>
                <option value="FIXED">FIXED USD ($)</option>
              </select>
            </div>

            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="pr-dval"
              >
                DISCOUNT VALUE *
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm"
                id="pr-dval"
                min="1"
                onChange={(e) => setDiscountValue(e.target.value)}
                required
                type="number"
                value={discountValue}
              />
            </div>

            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="pr-min"
              >
                MIN BASKET USD
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm"
                id="pr-min"
                min="0"
                onChange={(e) => setMinSubtotalUsd(e.target.value)}
                type="number"
                value={minSubtotalUsd}
              />
            </div>

            <div>
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="pr-gate"
              >
                ACCESS GATE TARGET
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs"
                id="pr-gate"
                onChange={(e) => setGateTarget(e.target.value)}
                value={gateTarget}
              />
            </div>

            <div className="md:col-span-2">
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-outline mb-1"
                htmlFor="pr-desc"
              >
                INTERNAL BRIEFING NOTE
              </label>
              <textarea
                className="w-full bg-surface-container-highest px-4 py-3 font-body-sm text-xs min-h-16"
                id="pr-desc"
                onChange={(e) => setDescription(e.target.value)}
                value={description}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 bg-on-surface text-surface hover:bg-primary-fixed py-3 font-label-caps-sm text-xs uppercase font-bold"
              type="submit"
            >
              PUBLISH CAMPAIGN KEY
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
    </AdminShell>
  );
}
