'use client';

import React, { useEffect, useState } from 'react';
import { DossierHeaderNav } from '@/components/DossierHeaderNav';
import { ModalDialog } from '@/components/ModalDialog';
import { useStore } from '@/components/StoreContext';
import { StorefrontShell } from '@/components/StorefrontShell';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { Address } from '@/lib/types';

interface AddressFormState {
  label: string;
  classification: 'RESIDENTIAL' | 'OFFICE' | 'PRIVATE_VAULT';
  isDefault: boolean;
  recipientName: string;
  company: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  countryCode: string;
  phone: string;
  carrierPreference: string;
  packagingSpec: string;
  deliveryInstructions: string;
}

const EMPTY_FORM: AddressFormState = {
  label: 'PRIVATE RESIDENCE',
  classification: 'RESIDENTIAL',
  isDefault: false,
  recipientName: '',
  company: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  province: '',
  postalCode: '',
  country: 'Sri Lanka',
  countryCode: 'LK',
  phone: '',
  carrierPreference: 'DHL EXPRESS PRIORITY DDP',
  packagingSpec: 'ARCHIVAL_MONOLITH_BOX',
  deliveryInstructions: '',
};

export default function ShippingDossierPage() {
  const { announce } = useStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormState>(EMPTY_FORM);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAddresses = async () => {
    try {
      const res = await apiFetch<{ addresses: Address[] }>('/addresses');
      setAddresses(res.addresses || []);
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    apiFetch<{ addresses: Address[] }>('/addresses')
      .then((res) => {
        if (active) setAddresses(res.addresses || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setTouched(false);
    setDialogOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      classification:
        (addr.classification as AddressFormState['classification']) ||
        'RESIDENTIAL',
      isDefault: addr.isDefault,
      recipientName: addr.recipientName,
      company: addr.company || '',
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      province: addr.province || '',
      postalCode: addr.postalCode,
      country: addr.country,
      countryCode: addr.countryCode || 'LK',
      phone: addr.phone,
      carrierPreference: addr.carrierPreference || 'DHL EXPRESS PRIORITY DDP',
      packagingSpec: addr.packagingSpec || 'ARCHIVAL_MONOLITH_BOX',
      deliveryInstructions: addr.deliveryInstructions || '',
    });
    setTouched(false);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (
      !form.label.trim() ||
      !form.recipientName.trim() ||
      !form.addressLine1.trim() ||
      !form.city.trim() ||
      !form.postalCode.trim() ||
      !form.country.trim() ||
      !form.phone.trim()
    ) {
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await apiFetch(`/addresses/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(form),
        });
        announce(`UPDATED DESTINATION // ${form.label.toUpperCase()}`);
      } else {
        await apiFetch('/addresses', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        announce(`REGISTERED NEW DESTINATION // ${form.label.toUpperCase()}`);
      }
      await loadAddresses();
      setDialogOpen(false);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'UNABLE TO SAVE ADDRESS'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string, label: string) => {
    try {
      await apiFetch(`/addresses/${id}/default`, { method: 'PATCH' });
      await loadAddresses();
      announce(`PRIMARY DISPATCH SET TO ${label}`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'FAILED TO SET PRIMARY ADDRESS'), 'error');
    }
  };

  const handleDelete = async (id: string, label: string) => {
    try {
      await apiFetch(`/addresses/${id}`, { method: 'DELETE' });
      await loadAddresses();
      announce(`REMOVED DESTINATION // ${label}`);
    } catch (err: unknown) {
      announce(getErrorMessage(err, 'FAILED TO REMOVE DESTINATION'), 'error');
    }
  };

  const primaryAddr = addresses.find((a) => a.isDefault) || addresses[0];

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin py-10 space-y-8">
        <DossierHeaderNav
          activeTab="addresses"
          rightSlot={
            <button
              className="bg-on-surface text-surface hover:bg-primary-fixed px-5 py-2.5 font-label-caps-sm text-[11px] uppercase tracking-widest font-bold transition-colors"
              onClick={openCreateModal}
              type="button"
            >
              + REGISTER NEW DESTINATION
            </button>
          }
          subtitle="Manage international courier destinations, armored private vault handovers, and custom packaging specifications."
          title="SHIPPING DOSSIERS // ADDRESS BOOK"
        />

        {/* HUD Telemetry Strip */}
        <section
          aria-label="Destination Telemetry"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-surface-container-low p-5 space-y-1.5">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline">
              REGISTERED DESTINATIONS
            </span>
            <p className="font-data-mono text-2xl">
              {String(addresses.length).padStart(2, '0')} ACTIVE NODES
            </p>
          </div>
          <div className="bg-surface-container-low p-5 space-y-1.5">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline">
              PRIMARY COORDINATE DISPATCH
            </span>
            <p className="font-data-mono text-base uppercase text-primary-fixed truncate">
              {primaryAddr
                ? `${primaryAddr.city}, ${primaryAddr.countryCode}`
                : 'UNASSIGNED'}
            </p>
          </div>
          <div className="bg-surface-container-low p-5 space-y-1.5">
            <span className="font-label-caps-sm text-[10px] uppercase text-outline">
              COURIER SLA PROTOCOL
            </span>
            <p className="font-data-mono text-base uppercase">
              {primaryAddr?.carrierPreference || 'DHL EXPRESS PRIORITY DDP'}
            </p>
          </div>
        </section>

        {/* Address Cards Grid */}
        {loading ? (
          <div className="bg-surface-container-low p-10 font-data-mono text-xs uppercase text-outline">
            LOADING SHIPPING COORDINATES...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <article
                className="bg-surface-container-low p-6 md:p-8 flex flex-col justify-between gap-6"
                key={addr.id}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-surface-container-highest text-on-surface px-2.5 py-1 font-data-mono text-[10px] uppercase tracking-wider">
                          {addr.classification.replace('_', ' ')}
                        </span>
                        {addr.isDefault ? (
                          <span className="bg-on-surface text-surface px-2.5 py-1 font-data-mono text-[10px] uppercase font-bold">
                            PRIMARY DESTINATION
                          </span>
                        ) : null}
                      </div>
                      <h2 className="font-headline-md text-headline-md uppercase">
                        {addr.label}
                      </h2>
                    </div>

                    {/* Architectural Coordinate Radar Graphic */}
                    <div className="bg-surface-container p-2.5 flex items-center gap-2.5 shrink-0">
                      <svg
                        aria-hidden="true"
                        className="w-8 h-8 text-primary-fixed"
                        fill="none"
                        viewBox="0 0 36 36"
                      >
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          stroke="currentColor"
                          strokeOpacity="0.3"
                          strokeWidth="1"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="8"
                          stroke="currentColor"
                          strokeOpacity="0.6"
                          strokeWidth="1"
                        />
                        <circle cx="18" cy="18" fill="currentColor" r="2.5" />
                        <path
                          d="M18 2v5M18 29v5M2 18h5M29 18h5"
                          stroke="currentColor"
                          strokeWidth="1"
                        />
                      </svg>
                      <span className="font-data-mono text-[10px] text-outline uppercase">
                        {addr.coordinates || '6.9271° N, 79.8612° E'}
                      </span>
                    </div>
                  </div>

                  <address className="not-italic font-body-sm text-body-sm text-on-surface-variant space-y-1">
                    <p className="text-on-surface font-medium uppercase">
                      {addr.recipientName}
                      {addr.company ? ` // ${addr.company}` : ''}
                    </p>
                    <p>{addr.addressLine1}</p>
                    {addr.addressLine2 ? <p>{addr.addressLine2}</p> : null}
                    <p>
                      {addr.city}
                      {addr.province ? `, ${addr.province}` : ''}{' '}
                      {addr.postalCode}
                    </p>
                    <p className="uppercase">{addr.country}</p>
                    <p className="font-data-mono text-xs text-outline pt-1">
                      TEL: {addr.phone}
                    </p>
                  </address>

                  <dl className="grid grid-cols-2 gap-3 bg-surface-container p-3.5 font-data-mono text-[11px]">
                    <div>
                      <dt className="text-outline text-[10px]">CARRIER</dt>
                      <dd className="text-on-surface mt-0.5">
                        {addr.carrierPreference}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-outline text-[10px]">
                        PACKAGING SPEC
                      </dt>
                      <dd className="text-on-surface mt-0.5">
                        {addr.packagingSpec}
                      </dd>
                    </div>
                  </dl>

                  {addr.deliveryInstructions ? (
                    <p className="font-data-mono text-[11px] text-outline uppercase">
                      NOTE: {addr.deliveryInstructions}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {!addr.isDefault ? (
                    <button
                      className="bg-on-surface text-surface hover:bg-primary-fixed px-4 py-2 font-label-caps-sm text-[11px] uppercase tracking-wider font-bold transition-colors"
                      onClick={() => void handleSetDefault(addr.id, addr.label)}
                      type="button"
                    >
                      SET AS PRIMARY
                    </button>
                  ) : null}
                  <button
                    className="bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 font-label-caps-sm text-[11px] uppercase tracking-wider transition-colors"
                    onClick={() => openEditModal(addr)}
                    type="button"
                  >
                    EDIT SPEC
                  </button>
                  <button
                    className="bg-surface-container-high hover:bg-error-container hover:text-on-error-container px-4 py-2 font-label-caps-sm text-[11px] uppercase tracking-wider transition-colors ml-auto"
                    onClick={() => void handleDelete(addr.id, addr.label)}
                    type="button"
                  >
                    REMOVE
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Register / Edit Address Dialog (autofill-address-form compliant) */}
      <ModalDialog
        maxWidthClass="max-w-2xl"
        onClose={() => setDialogOpen(false)}
        open={dialogOpen}
        titleId="address-modal-title"
      >
        <form
          className="p-6 md:p-8 space-y-5"
          noValidate
          onSubmit={(e) => void handleSave(e)}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-data-mono text-[10px] text-outline uppercase tracking-widest">
                DESTINATION TELEMETRY
              </p>
              <h2
                className="font-headline-md text-headline-md uppercase mt-1"
                id="address-modal-title"
              >
                {editingId
                  ? 'UPDATE SHIPPING DOSSIER'
                  : 'REGISTER NEW DESTINATION'}
              </h2>
            </div>
            <button
              aria-label="Close address dialog"
              onClick={() => setDialogOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="addr-label"
              >
                DOSSIER LABEL *
              </label>
              <input
                className={`w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm focus:outline-none ${
                  touched ? 'user-invalid-fallback' : ''
                }`}
                id="addr-label"
                name="label"
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. MAYFAIR LONDON SUITE"
                required
                value={form.label}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="addr-class"
              >
                CLASSIFICATION
              </label>
              <select
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm focus:outline-none"
                id="addr-class"
                onChange={(e) =>
                  setForm({
                    ...form,
                    classification: e.target
                      .value as AddressFormState['classification'],
                  })
                }
                value={form.classification}
              >
                <option value="RESIDENTIAL">RESIDENTIAL</option>
                <option value="OFFICE">ATELIER / OFFICE</option>
                <option value="PRIVATE_VAULT">PRIVATE VAULT</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="addr-name"
              >
                RECIPIENT FULL NAME *
              </label>
              <input
                autoComplete="shipping name"
                className={`w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm focus:outline-none ${
                  touched ? 'user-invalid-fallback' : ''
                }`}
                id="addr-name"
                name="name"
                onChange={(e) =>
                  setForm({ ...form, recipientName: e.target.value })
                }
                required
                value={form.recipientName}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="addr-tel"
              >
                COURIER CONTACT PHONE *
              </label>
              <input
                autoComplete="shipping tel"
                className={`w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm focus:outline-none ${
                  touched ? 'user-invalid-fallback' : ''
                }`}
                id="addr-tel"
                name="tel"
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+44 20 7946 0821"
                required
                type="tel"
                value={form.phone}
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="addr-line1"
              >
                STREET ADDRESS LINE 1 *
              </label>
              <input
                autoComplete="shipping address-line1"
                className={`w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm focus:outline-none ${
                  touched ? 'user-invalid-fallback' : ''
                }`}
                id="addr-line1"
                name="address-line1"
                onChange={(e) =>
                  setForm({ ...form, addressLine1: e.target.value })
                }
                required
                value={form.addressLine1}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="addr-line2"
              >
                SUITE / APARTMENT (OPTIONAL)
              </label>
              <input
                autoComplete="shipping address-line2"
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm focus:outline-none"
                id="addr-line2"
                name="address-line2"
                onChange={(e) =>
                  setForm({ ...form, addressLine2: e.target.value })
                }
                value={form.addressLine2}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="addr-city"
              >
                CITY *
              </label>
              <input
                autoComplete="shipping address-level2"
                className={`w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm focus:outline-none ${
                  touched ? 'user-invalid-fallback' : ''
                }`}
                id="addr-city"
                name="city"
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
                value={form.city}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="addr-postal"
              >
                POSTAL / ZIP CODE *
              </label>
              <input
                autoComplete="shipping postal-code"
                className={`w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm focus:outline-none ${
                  touched ? 'user-invalid-fallback' : ''
                }`}
                id="addr-postal"
                name="postal"
                onChange={(e) =>
                  setForm({ ...form, postalCode: e.target.value })
                }
                required
                value={form.postalCode}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="addr-country"
              >
                COUNTRY *
              </label>
              <input
                autoComplete="shipping country-name"
                className={`w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm focus:outline-none ${
                  touched ? 'user-invalid-fallback' : ''
                }`}
                id="addr-country"
                name="country"
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                required
                value={form.country}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="addr-carrier"
              >
                CARRIER PROTOCOL
              </label>
              <select
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm focus:outline-none"
                id="addr-carrier"
                onChange={(e) =>
                  setForm({ ...form, carrierPreference: e.target.value })
                }
                value={form.carrierPreference}
              >
                <option value="DHL EXPRESS PRIORITY DDP">
                  DHL EXPRESS PRIORITY DDP
                </option>
                <option value="COLOMBO WHITE-GLOVE COURIER">
                  COLOMBO WHITE-GLOVE COURIER
                </option>
                <option value="FEDEX INTERNATIONAL FIRST">
                  FEDEX INTERNATIONAL FIRST
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                className="block font-label-caps-sm text-label-caps-sm uppercase text-on-surface-variant"
                htmlFor="addr-packaging"
              >
                PACKAGING SPECIFICATION
              </label>
              <select
                className="w-full bg-surface-container-highest px-4 py-3 font-data-mono text-sm focus:outline-none"
                id="addr-packaging"
                onChange={(e) =>
                  setForm({ ...form, packagingSpec: e.target.value })
                }
                value={form.packagingSpec}
              >
                <option value="ARCHIVAL_MONOLITH_BOX">
                  ARCHIVAL MONOLITH BOX
                </option>
                <option value="STEALTH_UNBRANDED_WRAP">
                  STEALTH UNBRANDED WRAP
                </option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer font-data-mono text-xs">
            <input
              checked={form.isDefault}
              className="w-4 h-4 accent-primary-fixed"
              onChange={(e) =>
                setForm({ ...form, isDefault: e.target.checked })
              }
              type="checkbox"
            />
            <span>SET AS PRIMARY DISPATCH COORDINATE</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 bg-on-surface text-surface py-3 font-label-caps-sm text-xs uppercase tracking-widest font-bold hover:bg-primary-fixed transition-colors disabled:opacity-50"
              disabled={saving}
              type="submit"
            >
              {saving ? 'TRANSMITTING...' : 'SAVE DESTINATION DOSSIER'}
            </button>
            <button
              className="bg-surface-container-high px-5 py-3 font-label-caps-sm text-xs uppercase tracking-widest"
              onClick={() => setDialogOpen(false)}
              type="button"
            >
              CANCEL
            </button>
          </div>
        </form>
      </ModalDialog>
    </StorefrontShell>
  );
}
