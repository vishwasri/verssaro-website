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

function SignUpFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshDossier, announce } = useStore();
  const { formRef, validateBeforeSubmit } = useAccessibleFormValidation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
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
      const payload: {
        name: string;
        email: string;
        password: string;
        phone?: string;
      } = {
        name: name.trim(),
        email: email.trim(),
        password,
      };
      if (phone.trim()) {
        payload.phone = phone.trim();
      }

      const res = await apiFetch<{ accessToken: string; user: UserDossier }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );
      setAuthToken(res.accessToken);
      await refreshDossier();
      announce(
        `DOSSIER PROVISIONED: ${res.user.dossierCode || res.user.name.toUpperCase()}`,
      );
      router.push(redirectTarget);
    } catch (err: unknown) {
      setServerError(getErrorMessage(err, 'UNABLE TO CREATE PATRON DOSSIER'));
    } finally {
      setSubmitting(false);
    }
  };

  const isDuplicateEmailError =
    serverError?.toLowerCase().includes('already registered') ?? false;

  return (
    <AuthShell
      codeLabel="DOSSIER // NEW"
      eyebrow="PATRON ENROLMENT"
      headingId="signup-heading"
      mode="signup"
      subtitle="Initialize a sovereign VERSSARO dossier with a bound Polygon custody wallet, Colombo concierge routing, and USD $100 archival credit."
      title="CREATE ACCOUNT"
    >
      <form
        action="/account"
        aria-labelledby="signup-heading"
        className="space-y-5"
        method="POST"
        noValidate
        onSubmit={(e) => void handleSubmit(e)}
        ref={formRef}
      >
        <AuthField
          autoComplete="name"
          enterKeyHint="next"
          errorId="signup-name-error"
          errorMessage="Enter your full name (at least 2 characters)."
          hint="Used for order labels and bespoke atelier certificates."
          hintId="signup-name-hint"
          id="signup-name"
          label="Full Name"
          name="name"
          onChange={setName}
          placeholder="Kasun Perera"
          required
          minLength={2}
          type="text"
          value={name}
        />

        <AuthField
          autoCapitalize="none"
          autoComplete="username"
          autoCorrect="off"
          enterKeyHint="next"
          errorId="signup-email-error"
          errorMessage="Enter an email address in the format patron@domain.com."
          hint="Format: patron@domain.com"
          hintId="signup-email-hint"
          id="signup-email"
          inputMode="email"
          label="Patron Email"
          name="email"
          onChange={setEmail}
          placeholder="kasun.perera@verssaro.vip"
          required
          spellCheck={false}
          type="email"
          value={email}
        />

        <AuthField
          autoComplete="tel"
          enterKeyHint="next"
          errorId="signup-phone-error"
          errorMessage="Enter a valid telephone number including country code."
          hint="Include country code for DHL / Atelier courier alerts."
          hintId="signup-phone-hint"
          id="signup-phone"
          inputMode="tel"
          label="Dispatch Phone"
          name="phone"
          onChange={setPhone}
          placeholder="+94 77 000 0000"
          type="tel"
          value={phone}
        />

        <PasswordAuthField
          autoComplete="new-password"
          enterKeyHint="done"
          errorId="signup-password-error"
          errorMessage="Passphrase must be at least 8 characters."
          hint="At least 8 characters. Mix uppercase, lowercase, numbers, or symbols for stronger security."
          hintId="signup-password-rules"
          id="signup-password"
          label="Create Passphrase"
          minLength={8}
          name="password"
          onChange={setPassword}
          placeholder="At least 8 characters"
          required
          value={password}
        />

        <div className="auth-field space-y-2 pt-1">
          <div className="flex items-start gap-3">
            <input
              aria-invalid="false"
              checked={acceptedPolicy}
              className="auth-checkbox mt-0.5 h-5 w-5 shrink-0 accent-[#e2e2e2] cursor-pointer"
              data-error="signup-policy-error"
              id="signup-policy"
              name="acceptedPolicy"
              onChange={(e) => setAcceptedPolicy(e.target.checked)}
              required
              type="checkbox"
            />
            <label
              className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer leading-relaxed"
              htmlFor="signup-policy"
            >
              I agree to the VERSSARO{' '}
              <Link
                className="text-on-surface underline underline-offset-4 hover:text-primary-fixed"
                href="/terms"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                className="text-on-surface underline underline-offset-4 hover:text-primary-fixed"
                href="/privacy"
              >
                Privacy Policy
              </Link>
              .
              <span aria-hidden="true" className="text-primary-fixed ml-1">
                *
              </span>
            </label>
          </div>

          <p
            className="auth-error-msg items-center gap-1.5 font-data-mono text-[11px] text-error"
            id="signup-policy-error"
          >
            <span
              aria-label="Error"
              className="material-symbols-outlined text-[15px] shrink-0"
              role="img"
            >
              error
            </span>
            <span>Confirm the Terms of Service and Privacy Policy to continue.</span>
          </p>
        </div>

        {serverError ? (
          <div
            aria-live="assertive"
            className="bg-error-container text-on-error-container px-4 py-3 space-y-2 font-data-mono text-xs uppercase"
            role="alert"
          >
            <div className="flex items-center gap-2.5">
              <span
                aria-label="Error"
                className="material-symbols-outlined text-[18px] shrink-0"
                role="img"
              >
                error
              </span>
              <span>{serverError}</span>
            </div>
            {isDuplicateEmailError ? (
              <Link
                className="inline-block underline font-bold"
                href="/signin"
              >
                SIGN IN WITH EXISTING DOSSIER -&gt;
              </Link>
            ) : null}
          </div>
        ) : null}

        <button
          className="auth-btn w-full min-h-[52px] bg-on-surface text-surface hover:bg-primary-fixed px-6 py-3.5 font-label-caps-lg text-label-caps-lg uppercase tracking-[0.2em] font-bold transition-colors disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'PROVISIONING DOSSIER...' : 'CREATE ACCOUNT'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center font-data-mono text-xs uppercase tracking-widest">
          INITIALIZING DOSSIER REGISTRATION...
        </div>
      }
    >
      <SignUpFormContent />
    </Suspense>
  );
}
