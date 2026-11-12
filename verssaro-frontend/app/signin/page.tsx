'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthField, PasswordAuthField } from '@/components/AuthFields';
import { AuthShell } from '@/components/AuthShell';
import { useStore } from '@/components/StoreContext';
import { apiFetch, getErrorMessage, setAuthToken } from '@/lib/api';
import { UserDossier } from '@/lib/types';
import { useAccessibleFormValidation } from '@/lib/useAccessibleFormValidation';

const DEMO_PATRONS = [
  {
    label: 'ALEXANDER WRIGHT',
    tier: 'TIER 01 // COLOMBO',
    email: 'alexander.wright@verssaro.vip',
  },
  {
    label: 'JULIAN DE SILVA',
    tier: 'TIER 01 // LONDON',
    email: 'julian.desilva@verssaro.vip',
  },
];

function SignInFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dossier, isAuthenticated, refreshDossier, signOut, announce } =
    useStore();
  const { formRef, validateBeforeSubmit } = useAccessibleFormValidation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const rawRedirect = searchParams.get('redirect');
  const redirectTarget =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/account';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    if (!validateBeforeSubmit()) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ accessToken: string; user: UserDossier }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        },
      );
      setAuthToken(res.accessToken);
      await refreshDossier();
      announce(`SIGNED IN AS ${res.user.name.toUpperCase()}`);
      router.push(redirectTarget);
    } catch (err: unknown) {
      setServerError(
        getErrorMessage(err, 'INVALID PATRON EMAIL OR ACCESS PASSPHRASE'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const applyDemoPatron = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('verssaro2025');
    setServerError(null);
  };

  return (
    <AuthShell
      codeLabel="AUTH // PORTAL"
      eyebrow="PATRON ACCESS"
      headingId="signin-heading"
      mode="signin"
      subtitle="Authenticate with your registered VERSSARO email and passphrase to unlock your order ledger, Polygon wallet telemetry, and NFC provenance vault."
      title="SIGN IN"
    >
      {isAuthenticated && dossier ? (
        <div className="bg-surface-container p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
              ● ACTIVE SESSION // {dossier.dossierCode}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface">
              Currently signed in as <strong>{dossier.name}</strong> (
              {dossier.email})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="auth-btn bg-on-surface text-surface px-3.5 py-2 font-label-caps-sm text-[10px] uppercase tracking-widest font-bold hover:bg-primary-fixed transition-colors"
              href="/account"
            >
              OPEN DOSSIER
            </Link>
            <button
              className="auth-btn bg-surface-container-high text-on-surface px-3.5 py-2 font-label-caps-sm text-[10px] uppercase tracking-widest hover:bg-surface-container-highest transition-colors"
              onClick={signOut}
              type="button"
            >
              SIGN OUT
            </button>
          </div>
        </div>
      ) : null}

      <form
        action="/account"
        aria-labelledby="signin-heading"
        className="space-y-5"
        method="POST"
        noValidate
        onSubmit={(e) => void handleSubmit(e)}
        ref={formRef}
      >
        <AuthField
          autoCapitalize="none"
          autoComplete="username"
          autoCorrect="off"
          enterKeyHint="next"
          errorId="signin-email-error"
          errorMessage="Enter an email address in the format patron@domain.com."
          hint="Format: patron@domain.com"
          hintId="signin-email-hint"
          id="signin-email"
          inputMode="email"
          label="Patron Email"
          name="email"
          onChange={setEmail}
          placeholder="alexander.wright@verssaro.vip"
          required
          spellCheck={false}
          type="email"
          value={email}
        />

        <PasswordAuthField
          autoComplete="current-password"
          enterKeyHint="done"
          errorId="signin-password-error"
          errorMessage="Enter your dossier access passphrase (at least 4 characters)."
          id="signin-password"
          label="Access Passphrase"
          labelRightSlot={
            <Link
              className="font-data-mono text-[10px] uppercase tracking-[0.14em] text-outline hover:text-on-surface underline underline-offset-4"
              href="/client-care"
            >
              Recovery help
            </Link>
          }
          minLength={4}
          name="password"
          onChange={setPassword}
          placeholder="Enter passphrase"
          required
          value={password}
        />

        {serverError ? (
          <div
            aria-live="assertive"
            className="bg-error-container text-on-error-container px-4 py-3 flex items-center gap-2.5 font-data-mono text-xs uppercase"
            role="alert"
          >
            <span
              aria-label="Error"
              className="material-symbols-outlined text-[18px] shrink-0"
              role="img"
            >
              error
            </span>
            <span>{serverError}</span>
          </div>
        ) : null}

        <button
          className="auth-btn w-full min-h-[52px] bg-on-surface text-surface hover:bg-primary-fixed px-6 py-3.5 font-label-caps-lg text-label-caps-lg uppercase tracking-[0.2em] font-bold transition-colors disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'VERIFYING CREDENTIALS...' : 'SIGN IN'}
        </button>
      </form>

      {/* Demo Seeded Patron Quick-Fill (placed below form for mobile keyboard clearance) */}
      <div className="bg-surface-container p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-data-mono text-[10px] uppercase tracking-[0.18em] text-outline">
            ATELIER DEMO CREDENTIALS (PASSWORD: verssaro2025)
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DEMO_PATRONS.map((patron) => (
            <button
              className="auth-btn text-left bg-surface-container-high hover:bg-surface-container-highest p-3 space-y-1 transition-colors"
              key={patron.email}
              onClick={() => applyDemoPatron(patron.email)}
              type="button"
            >
              <span className="block font-label-caps-sm text-[10px] uppercase tracking-[0.16em] text-on-surface">
                FILL {patron.label}
              </span>
              <span className="block font-data-mono text-[10px] text-outline truncate">
                {patron.email}
              </span>
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center font-data-mono text-xs uppercase tracking-widest">
          INITIALIZING PATRON ACCESS...
        </div>
      }
    >
      <SignInFormContent />
    </Suspense>
  );
}
