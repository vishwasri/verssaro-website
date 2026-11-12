'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { DossierHeaderNav } from '@/components/DossierHeaderNav';
import { ModalDialog } from '@/components/ModalDialog';
import { useStore } from '@/components/StoreContext';
import { StorefrontShell } from '@/components/StorefrontShell';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { NfcArtifact, VaultTransferReceipt } from '@/lib/types';

interface VaultResponse {
  owner: {
    name: string;
    dossierCode: string;
    tier: string;
    walletAddress: string;
    walletFull: string;
    restorationPassesRemaining: number;
    restorationPassesTotal: number;
  };
  metrics: {
    authenticatedCount: number;
    totalPoolCount: number;
    totalValuationUsd: number;
    contractDeployment: string;
    lastVerifiedLabel: string;
  };
  artifacts: NfcArtifact[];
  transfers: VaultTransferReceipt[];
}

interface ScanResponse {
  authentic: boolean;
  cryptoProtocol: string;
  isOwnedByCaller: boolean;
  canBind: boolean;
  artifact: NfcArtifact;
  telemetry: {
    rssiDbm: number;
    siliconChip: string;
    blockHeight: number;
    lastScannedAt: string;
  };
}

export default function NfcProvenanceVaultPage() {
  const { formatPrice, refreshDossier, announce } = useStore();
  const [vault, setVault] = useState<VaultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCertId, setExpandedCertId] = useState<string | null>(null);

  // Tap-to-authenticate scanner state & Modal 1
  const [scanUidInput, setScanUidInput] = useState('VRS-9941-8812-7F91');
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [cipherInput, setCipherInput] = useState('VRS-9941-8812-7F91');
  const [bindingChip, setBindingChip] = useState(false);

  // P2P Handover Modal 2
  const [transferArtifact, setTransferArtifact] = useState<NfcArtifact | null>(
    null,
  );
  const [transferMethod, setTransferMethod] = useState<
    'HEX' | 'VIP_HANDLE' | 'ESCROW'
  >('VIP_HANDLE');
  const [recipientInput, setRecipientInput] = useState('Julian De Silva');
  const [ack1, setAck1] = useState(true);
  const [ack2, setAck2] = useState(true);
  const [ack3, setAck3] = useState(true);
  const [transferring, setTransferring] = useState(false);

  // Immutable Ledger Receipt Modal 3
  const [receipt, setReceipt] = useState<VaultTransferReceipt | null>(null);

  // Care Pass booking state
  const [careBookingRef, setCareBookingRef] = useState<string | null>(null);

  const loadVault = async () => {
    try {
      const data = await apiFetch<VaultResponse>('/nfc/vault');
      setVault(data);
    } catch {
      // handled cleanly
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    apiFetch<VaultResponse>('/nfc/vault')
      .then((data) => {
        if (active) setVault(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleScanChip = async (uidOverride?: string) => {
    try {
      const res = await apiFetch<ScanResponse>('/nfc/scan', {
        method: 'POST',
        body: JSON.stringify({ uid: uidOverride ?? scanUidInput.trim() }),
      });
      setScanResult(res);
      setCipherInput(res.artifact.tagLabel || res.artifact.uid);
      setScanModalOpen(true);
      announce(`TARGET DISCOVERED // ${res.artifact.uid}`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'NO NFC SIGNATURE DETECTED'), 'error');
    }
  };

  const handleBindChip = async () => {
    if (!scanResult) return;
    setBindingChip(true);
    try {
      await apiFetch('/nfc/bind', {
        method: 'POST',
        body: JSON.stringify({
          artifactIdOrUid: scanResult.artifact.id || cipherInput.trim(),
        }),
      });
      await Promise.all([loadVault(), refreshDossier()]);
      setScanModalOpen(false);
      announce(
        `GARMENT BOUND TO PRIVATE VAULT // ${scanResult.artifact.garmentTitle.toUpperCase()}`,
      );
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'BINDING FAILED'), 'error');
    } finally {
      setBindingChip(false);
    }
  };

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferArtifact || !ack1 || !ack2 || !ack3) return;
    setTransferring(true);
    try {
      const res = await apiFetch<{
        receipt: VaultTransferReceipt;
        artifact: NfcArtifact;
      }>('/nfc/transfer', {
        method: 'POST',
        body: JSON.stringify({
          artifactId: transferArtifact.id,
          recipientInput: recipientInput.trim(),
          transferMethod,
        }),
      });
      await Promise.all([loadVault(), refreshDossier()]);
      setTransferArtifact(null);
      setReceipt(res.receipt);
      announce(`PROVENANCE TRANSFERRED // ${res.receipt.receiptCode}`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'P2P TRANSFER FAILED'), 'error');
    } finally {
      setTransferring(false);
    }
  };

  const handleRedeemCarePass = async () => {
    try {
      const res = await apiFetch<{
        booked: boolean;
        restorationPassesRemaining: number;
        bookingRef: string;
      }>('/nfc/care-pass', { method: 'POST' });
      setCareBookingRef(res.bookingRef);
      await Promise.all([loadVault(), refreshDossier()]);
      announce(`ATELIER RESTORATION PASS BOOKED // ${res.bookingRef}`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'NO CARE PASSES REMAINING'), 'error');
    }
  };

  const openReceiptForArtifact = (artifact: NfcArtifact) => {
    const existing = vault?.transfers.find((t) => t.artifactId === artifact.id);
    if (existing) {
      setReceipt({
        ...existing,
        artifact,
        fromWalletShort: `${existing.fromWallet.slice(0, 6)}...${existing.fromWallet.slice(-4)}`,
        toWalletShort: `${existing.toWallet.slice(0, 6)}...${existing.toWallet.slice(-4)}`,
      });
      return;
    }

    setReceipt({
      id: artifact.id,
      receiptCode: `REC-2025-${artifact.tokenId.replace('#', '')}-MINT`,
      artifactId: artifact.id,
      artifact,
      fromOwnerName: 'VERSSARO Atelier Mint',
      fromWallet: '0x00000000000000ATELIER01',
      toOwnerName: vault?.owner.name || 'Alexander Wright',
      toWallet: vault?.owner.walletFull || '0x7F91A30C4B118E9A2C4E',
      transferMethod: 'HEX',
      valuationUsd: artifact.valuationUsd,
      royaltyUsd: 0,
      gasMatic: '0.0000 MATIC',
      txHash: artifact.keccakHash,
      blockNumber: 64819290,
      networkName: 'Polygon PoS // Atelier Rollup',
      status: 'CONFIRMED',
      reassignedPerks: [artifact.smartPerk, 'Lifetime Atelier Repair Eligibility'],
      fromWalletShort: '0x0000...ER01',
      toWalletShort: vault?.owner.walletAddress || '0x7F91...2C4e',
      createdAt: artifact.lastVerifiedAt,
    });
  };

  const royaltyUsd = transferArtifact
    ? Number((transferArtifact.valuationUsd * 0.05).toFixed(2))
    : 0;

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin py-10 space-y-8">
        <DossierHeaderNav
          activeTab="vault"
          rightSlot={
            <button
              className="bg-on-surface text-surface hover:bg-primary-fixed px-5 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest font-bold transition-colors flex items-center gap-2"
              onClick={() => void handleScanChip('')}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">
                nfc
              </span>
              <span>+ SCAN / BIND CHIP</span>
            </button>
          }
          subtitle="Encrypted NTAG 424 DNA physical garments anchored to your Sovereign Wallet with instant P2P custody transfer and Atelier care privileges."
          title="NFC PROVENANCE VAULT // SILICON LEDGER"
        />

        {/* Vault HUD Metrics */}
        <section
          aria-label="Vault Custody Telemetry"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-surface-container-low p-5 space-y-1.5">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline">
              AUTHENTICATED GARMENTS
            </span>
            <p className="font-data-mono text-2xl">
              {String(vault?.metrics.authenticatedCount ?? 0).padStart(2, '0')}{' '}
              {'// BOUND'}
            </p>
          </div>
          <div className="bg-surface-container-low p-5 space-y-1.5">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline">
              ANCHOR WALLET // POLYGON
            </span>
            <p className="font-data-mono text-xl text-primary-fixed">
              {vault?.owner.walletAddress || '0x7F91...2C4e'}
            </p>
          </div>
          <div className="bg-surface-container-low p-5 space-y-1.5">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline">
              TOTAL ARCHIVAL VALUATION
            </span>
            <p className="font-data-mono text-2xl">
              {formatPrice(vault?.metrics.totalValuationUsd ?? 0)}
            </p>
          </div>
          <div className="bg-surface-container-low p-5 space-y-1.5">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline">
              LAST VERIFIED TELEMETRY
            </span>
            <p className="font-data-mono text-xl text-on-surface">
              {vault?.metrics.lastVerifiedLabel || '12m AGO'}
            </p>
          </div>
        </section>

        {/* Main 12-Col Layout: Owned Artifacts (8 Cols) + Authentication Terminal & Care Pass (4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Physical Vault Cards */}
          <div className="lg:col-span-8 space-y-6">
            {loading ? (
              <div className="bg-surface-container-low p-10 font-data-mono text-xs uppercase text-outline">
                POLLING SILICON PROVENANCE LEDGER...
              </div>
            ) : (vault?.artifacts.length ?? 0) === 0 ? (
              <div className="bg-surface-container-low p-10 text-center space-y-4">
                <p className="font-data-mono text-sm uppercase text-on-surface-variant">
                  NO ACTIVE NFC GARMENTS IN CUSTODY. SCAN A HARDWARE CHIP TO BIND.
                </p>
                <button
                  className="bg-on-surface text-surface px-6 py-3 font-label-caps-sm text-xs uppercase tracking-widest font-bold"
                  onClick={() => void handleScanChip('')}
                  type="button"
                >
                  RUN RADAR DISCOVERY
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vault?.artifacts.map((artifact) => {
                  const certOpen = expandedCertId === artifact.id;
                  return (
                    <article
                      className="bg-surface-container-low flex flex-col justify-between"
                      key={artifact.id}
                    >
                      <div>
                        <div className="relative h-64 bg-surface-container overflow-hidden">
                          <Image
                            alt={artifact.garmentTitle}
                            className="object-cover"
                            fill
                            sizes="(max-width: 768px) 100vw, 40vw"
                            src={artifact.imageUrl}
                          />
                          <div className="absolute top-3 left-3 bg-surface/90 backdrop-blur px-2.5 py-1 font-data-mono text-[10px] text-primary-fixed uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-primary-fixed inline-block" />
                            <span>
                              VERIFIED {'//'} {artifact.status}
                            </span>
                          </div>
                          <div className="absolute bottom-3 right-3 bg-on-surface text-surface px-2.5 py-1 font-data-mono text-[11px] font-bold">
                            {artifact.tokenId}
                          </div>
                        </div>

                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between font-data-mono text-[10px] text-outline uppercase">
                            <span>{artifact.tagLabel}</span>
                            <span>{artifact.editionRun}</span>
                          </div>
                          <h2 className="font-headline-md text-lg uppercase tracking-tight">
                            {artifact.garmentTitle}
                          </h2>
                          <p className="font-data-mono text-xs text-on-surface-variant">
                            SIZE {artifact.size} {'//'} {artifact.colorway}{' '}
                            {'//'} {formatPrice(artifact.valuationUsd)}
                          </p>

                          <dl className="bg-surface-container p-3 space-y-1.5 font-data-mono text-[11px]">
                            <div className="flex justify-between">
                              <dt className="text-outline">HARDWARE UID</dt>
                              <dd>{artifact.uid}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-outline">SILICON PLACEMENT</dt>
                              <dd>{artifact.siliconLocation}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-outline">SMART PRIVILEGE</dt>
                              <dd className="text-primary-fixed text-right">
                                {artifact.smartPerk}
                              </dd>
                            </div>
                          </dl>

                          {certOpen ? (
                            <div className="bg-surface-container-lowest p-3 font-data-mono text-[10px] space-y-1 break-all">
                              <p className="text-outline">KECCAK-256 PROOF:</p>
                              <p className="text-on-surface">
                                {artifact.keccakHash}
                              </p>
                              <p className="text-outline pt-1">
                                TEXTILE SPEC: {artifact.textileSpec}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="p-5 pt-0 grid grid-cols-3 gap-2">
                        <button
                          className="bg-surface-container-high hover:bg-surface-container-highest py-2.5 font-label-caps-sm text-[10px] uppercase tracking-wider transition-colors"
                          onClick={() => openReceiptForArtifact(artifact)}
                          type="button"
                        >
                          LEDGER RECORD
                        </button>
                        <button
                          className="bg-on-surface text-surface hover:bg-primary-fixed py-2.5 font-label-caps-sm text-[10px] uppercase tracking-wider font-bold transition-colors"
                          onClick={() => setTransferArtifact(artifact)}
                          type="button"
                        >
                          P2P TRANSFER
                        </button>
                        <button
                          className="bg-surface-container-high hover:bg-surface-container-highest py-2.5 font-label-caps-sm text-[10px] uppercase tracking-wider transition-colors"
                          onClick={() =>
                            setExpandedCertId(certOpen ? null : artifact.id)
                          }
                          type="button"
                        >
                          {certOpen ? 'HIDE CERT' : 'CERTIFICATE'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Tap-To-Authenticate Terminal + Care Pass + Security */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-low p-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-data-mono text-[10px] uppercase tracking-[0.2em] text-primary-fixed">
                  SILICON SCANNER // READY
                </span>
                <span className="material-symbols-outlined text-primary-fixed">
                  contactless
                </span>
              </div>

              <h2 className="font-headline-md text-headline-md uppercase">
                TAP-TO-AUTHENTICATE TERMINAL
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Enter an engraved NTAG serial or launch radar discovery to bind
                unclaimed VERSSARO garments directly to your Polygon custody
                vault.
              </p>

              <div className="space-y-2">
                <label
                  className="block font-label-caps-sm text-[10px] uppercase text-outline"
                  htmlFor="nfc-serial-input"
                >
                  ENGRAVED CHIP SERIAL OR UID
                </label>
                <input
                  className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs text-on-surface focus:outline-none"
                  id="nfc-serial-input"
                  onChange={(e) => setScanUidInput(e.target.value)}
                  placeholder="VRS-9941-8812-7F91"
                  value={scanUidInput}
                />
              </div>

              <button
                className="w-full bg-on-surface text-surface hover:bg-primary-fixed py-3.5 font-label-caps-sm text-xs uppercase tracking-widest font-bold transition-colors"
                onClick={() => void handleScanChip()}
                type="button"
              >
                INITIATE HARDWARE SCAN
              </button>
            </div>

            {/* Care & Restoration Pass Booking */}
            <div className="bg-surface-container-low p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-data-mono text-[10px] uppercase tracking-[0.2em] text-outline">
                  PHYSICAL ATELIER CARE
                </span>
                <span className="bg-surface-container-highest px-2 py-0.5 font-data-mono text-[11px] text-primary-fixed">
                  {vault?.owner.restorationPassesRemaining ?? 3} /{' '}
                  {vault?.owner.restorationPassesTotal ?? 3} PASSES
                </span>
              </div>

              <h3 className="font-headline-md text-lg uppercase">
                COMPLIMENTARY RESTORATION SERVICE
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Redeem one Tier 01 Atelier Care Pass for enzyme steam
                reconditioning, brushed hardware polish, and hem reinforcement at
                Colombo Flagship #01.
              </p>

              <button
                className="w-full bg-surface-container-high hover:bg-on-surface hover:text-surface text-on-surface py-3 font-label-caps-sm text-xs uppercase tracking-widest transition-colors"
                onClick={() => void handleRedeemCarePass()}
                type="button"
              >
                BOOK COLOMBO RESTORATION PASS
              </button>

              {careBookingRef ? (
                <p className="font-data-mono text-xs text-primary-fixed uppercase">
                  CONFIRMED DISPATCH REF: {careBookingRef}
                </p>
              ) : null}
            </div>

            {/* Security Spec */}
            <div className="bg-surface-container-low p-6 space-y-3 font-data-mono text-[11px]">
              <h3 className="font-label-caps-sm text-xs uppercase text-on-surface">
                CRYPTOGRAPHIC SECURITY SPECS
              </h3>
              <div className="flex justify-between text-outline">
                <span>CHIP ARCHITECTURE</span>
                <span className="text-on-surface">NXP NTAG 424 DNA</span>
              </div>
              <div className="flex justify-between text-outline">
                <span>KEY CURVE</span>
                <span className="text-on-surface">ECDSA-SECP256K1</span>
              </div>
              <div className="flex justify-between text-outline">
                <span>SETTLEMENT LAYER</span>
                <span className="text-primary-fixed">POLYGON POS ROLLUP</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* MODAL 1: NFC Scan Authentication & Vault Binding */}
      <ModalDialog
        maxWidthClass="max-w-xl"
        onClose={() => setScanModalOpen(false)}
        open={scanModalOpen}
        titleId="nfc-scan-modal-title"
      >
        {scanResult ? (
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-data-mono text-[10px] text-primary-fixed uppercase tracking-[0.2em]">
                  TARGET DISCOVERED // {scanResult.cryptoProtocol}
                </p>
                <h2
                  className="font-headline-md text-headline-md uppercase mt-1"
                  id="nfc-scan-modal-title"
                >
                  NFC SILICON AUTHENTICATION
                </h2>
              </div>
              <button
                aria-label="Close scanner modal"
                onClick={() => setScanModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Radar Visual Telemetry */}
            <div className="bg-surface-container p-5 flex items-center gap-5">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <span className="absolute inset-0 bg-primary-fixed/15 animate-ping" />
                <span className="relative bg-surface-container-highest p-4">
                  <span className="material-symbols-outlined text-primary-fixed text-3xl">
                    contactless
                  </span>
                </span>
              </div>
              <div className="space-y-1 min-w-0">
                <p className="font-headline-md text-base uppercase">
                  {scanResult.artifact.garmentTitle}
                </p>
                <p className="font-data-mono text-xs text-outline">
                  UID: {scanResult.artifact.uid} {'//'} TOKEN{' '}
                  {scanResult.artifact.tokenId}
                </p>
                <p className="font-data-mono text-[11px] text-primary-fixed">
                  RSSI {scanResult.telemetry.rssiDbm} dBm {'//'}{' '}
                  {scanResult.telemetry.siliconChip}
                </p>
              </div>
            </div>

            <dl className="bg-surface-container-highest p-4 space-y-2 font-data-mono text-[11px]">
              <div className="flex justify-between gap-4">
                <dt className="text-outline">KECCAK-256 SIGNATURE</dt>
                <dd className="truncate max-w-[260px]">
                  {scanResult.artifact.keccakHash}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-outline">CUSTODY STATUS</dt>
                <dd>{scanResult.artifact.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-outline">SMART PRIVILEGES</dt>
                <dd className="text-primary-fixed">
                  {scanResult.artifact.smartPerk}
                </dd>
              </div>
            </dl>

            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-on-surface-variant"
                htmlFor="diagnostic-cipher"
              >
                DIAGNOSTIC CIPHER CONFIRMATION
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-xs focus:outline-none"
                id="diagnostic-cipher"
                onChange={(e) => setCipherInput(e.target.value)}
                value={cipherInput}
              />
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 bg-on-surface text-surface hover:bg-primary-fixed py-3.5 font-label-caps-sm text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-50"
                disabled={bindingChip}
                onClick={() => void handleBindChip()}
                type="button"
              >
                {bindingChip
                  ? 'ANCHORING ON-CHAIN...'
                  : 'BIND GARMENT TO PRIVATE VAULT'}
              </button>
              <button
                className="bg-surface-container-high px-5 py-3.5 font-label-caps-sm text-xs uppercase tracking-widest"
                onClick={() => setScanModalOpen(false)}
                type="button"
              >
                CLOSE
              </button>
            </div>
          </div>
        ) : null}
      </ModalDialog>

      {/* MODAL 2: P2P Provenance Handover */}
      <ModalDialog
        maxWidthClass="max-w-2xl"
        onClose={() => setTransferArtifact(null)}
        open={Boolean(transferArtifact)}
        titleId="p2p-transfer-modal-title"
      >
        {transferArtifact ? (
          <form
            className="p-6 md:p-8 space-y-6"
            onSubmit={(e) => void handleInitiateTransfer(e)}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-data-mono text-[10px] text-primary-fixed uppercase tracking-[0.2em]">
                  PEER-TO-PEER CUSTODY HANDOVER
                </p>
                <h2
                  className="font-headline-md text-headline-md uppercase mt-1"
                  id="p2p-transfer-modal-title"
                >
                  TRANSFER GARMENT PROVENANCE
                </h2>
              </div>
              <button
                aria-label="Close transfer modal"
                onClick={() => setTransferArtifact(null)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-surface-container p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-headline-md text-base uppercase">
                  {transferArtifact.garmentTitle}
                </p>
                <p className="font-data-mono text-xs text-outline">
                  {transferArtifact.uid} {'//'} {transferArtifact.tokenId}
                </p>
              </div>
              <span className="font-data-mono text-base text-primary-fixed">
                {formatPrice(transferArtifact.valuationUsd)}
              </span>
            </div>

            <div className="space-y-2">
              <span className="block font-label-caps-sm text-[10px] uppercase text-outline">
                CUSTODY TRANSFER METHOD
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['VIP_HANDLE', 'VIP CLIENT HANDLE'],
                    ['HEX', '0X POLYGON WALLET'],
                    ['ESCROW', 'ESCROW CLAIM LINK'],
                  ] as const
                ).map(([method, label]) => (
                  <button
                    className={`py-2.5 px-3 font-label-caps-sm text-[10px] uppercase tracking-wider transition-colors ${
                      transferMethod === method
                        ? 'bg-on-surface text-surface font-bold'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                    key={method}
                    onClick={() => setTransferMethod(method)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-[10px] uppercase text-on-surface-variant"
                htmlFor="p2p-recipient"
              >
                RECIPIENT COLLECTOR HANDLE OR WALLET ADDRESS
              </label>
              <input
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm focus:outline-none"
                id="p2p-recipient"
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder="Julian De Silva or 0x..."
                required
                value={recipientInput}
              />
            </div>

            <dl className="bg-surface-container p-4 space-y-2 font-data-mono text-xs">
              <div className="flex justify-between">
                <dt className="text-outline">POLYGON ROLLUP GAS</dt>
                <dd className="text-primary-fixed">0.0000 MATIC (SPONSORED)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-outline">
                  ATELIER SECONDARY ROYALTY (5.0%)
                </dt>
                <dd>{formatPrice(royaltyUsd)}</dd>
              </div>
            </dl>

            <div className="space-y-2.5 font-body-sm text-xs text-on-surface-variant">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  checked={ack1}
                  className="mt-0.5 accent-primary-fixed"
                  onChange={(e) => setAck1(e.target.checked)}
                  type="checkbox"
                />
                <span>
                  I confirm the physical garment is intact and prepared for
                  recipient verification.
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  checked={ack2}
                  className="mt-0.5 accent-primary-fixed"
                  onChange={(e) => setAck2(e.target.checked)}
                  type="checkbox"
                />
                <span>
                  On-chain custody transfer permanently reassigns smart Atelier
                  care privileges.
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  checked={ack3}
                  className="mt-0.5 accent-primary-fixed"
                  onChange={(e) => setAck3(e.target.checked)}
                  type="checkbox"
                />
                <span>
                  This cryptographic handover cannot be reversed once settled on
                  Polygon PoS.
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 bg-on-surface text-surface hover:bg-primary-fixed py-3.5 font-label-caps-sm text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-50"
                disabled={transferring || !ack1 || !ack2 || !ack3}
                type="submit"
              >
                {transferring ? 'SETTLING ROLLUP...' : 'SIGN & INITIATE HANDOVER'}
              </button>
              <button
                className="bg-surface-container-high px-5 py-3.5 font-label-caps-sm text-xs uppercase tracking-widest"
                onClick={() => setTransferArtifact(null)}
                type="button"
              >
                CANCEL
              </button>
            </div>
          </form>
        ) : null}
      </ModalDialog>

      {/* MODAL 3: Immutable Ledger Receipt */}
      <ModalDialog
        maxWidthClass="max-w-2xl"
        onClose={() => setReceipt(null)}
        open={Boolean(receipt)}
        titleId="ledger-receipt-modal-title"
      >
        {receipt ? (
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="bg-on-surface text-surface px-2.5 py-1 font-data-mono text-[10px] font-bold uppercase">
                  {receipt.status} {'//'} IMMUTABLE LEDGER RECEIPT
                </span>
                <h2
                  className="font-headline-md text-headline-md uppercase mt-2"
                  id="ledger-receipt-modal-title"
                >
                  {receipt.receiptCode}
                </h2>
              </div>
              <button
                aria-label="Close receipt modal"
                onClick={() => setReceipt(null)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-container p-4 font-data-mono text-xs">
              <div>
                <span className="text-outline text-[10px]">
                  PREVIOUS CUSTODIAN
                </span>
                <p className="text-on-surface mt-1">{receipt.fromOwnerName}</p>
                <p className="text-outline text-[11px]">
                  {receipt.fromWalletShort || receipt.fromWallet}
                </p>
              </div>
              <div>
                <span className="text-outline text-[10px]">
                  NEW DESIGNATED CUSTODIAN
                </span>
                <p className="text-primary-fixed mt-1">
                  {receipt.toOwnerName}
                </p>
                <p className="text-outline text-[11px]">
                  {receipt.toWalletShort || receipt.toWallet}
                </p>
              </div>
            </div>

            <div className="bg-surface-container-highest p-4 space-y-2 font-data-mono text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-outline">TX HASH</span>
                <button
                  className="text-primary-fixed hover:underline uppercase text-[10px]"
                  onClick={() => {
                    if (
                      typeof navigator !== 'undefined' &&
                      navigator.clipboard
                    ) {
                      void navigator.clipboard.writeText(receipt.txHash);
                    }
                    announce('TRANSACTION HASH COPIED');
                  }}
                  type="button"
                >
                  COPY HASH
                </button>
              </div>
              <p className="break-all text-on-surface text-[11px]">
                {receipt.txHash}
              </p>
              <div className="flex justify-between pt-2 text-[11px] text-outline">
                <span>BLOCK #{receipt.blockNumber}</span>
                <span>{receipt.networkName}</span>
                <span>GAS: {receipt.gasMatic}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-label-caps-sm text-[10px] uppercase text-outline">
                REASSIGNED SMART PRIVILEGES
              </span>
              <ul className="space-y-1.5">
                {receipt.reassignedPerks.map((perk) => (
                  <li
                    className="bg-surface-container px-3 py-2 font-data-mono text-xs flex items-center gap-2"
                    key={perk}
                  >
                    <span className="w-1.5 h-1.5 bg-primary-fixed" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="flex-1 bg-on-surface text-surface hover:bg-primary-fixed py-3 font-label-caps-sm text-xs uppercase tracking-widest font-bold transition-colors"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(receipt, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${receipt.receiptCode}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  announce('DOWNLOADED SIGNED JSON DOSSIER');
                }}
                type="button"
              >
                DOWNLOAD JSON DOSSIER
              </button>
              <button
                className="bg-surface-container-high px-5 py-3 font-label-caps-sm text-xs uppercase tracking-widest"
                onClick={() => setReceipt(null)}
                type="button"
              >
                RETURN TO VAULT
              </button>
            </div>
          </div>
        ) : null}
      </ModalDialog>
    </StorefrontShell>
  );
}
