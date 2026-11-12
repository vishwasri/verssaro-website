'use client';

import React, { useState } from 'react';

interface BaseFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  hint?: string;
  hintId?: string;
  errorId: string;
  errorMessage: string;
  enterKeyHint?:
    | 'enter'
    | 'done'
    | 'go'
    | 'next'
    | 'previous'
    | 'search'
    | 'send';
  placeholder?: string;
}

interface AuthFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'tel';
  autoComplete: string;
  spellCheck?: boolean;
  autoCapitalize?: string;
  autoCorrect?: string;
  inputMode?: 'text' | 'email' | 'tel';
}

/**
 * Text/email/tel field with above-input format guidance and post-interaction
 * validation messaging controlled via `:user-invalid` + ARIA synchronization.
 */
export function AuthField({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  required = false,
  minLength,
  maxLength,
  spellCheck,
  autoCapitalize,
  autoCorrect,
  inputMode,
  enterKeyHint = 'next',
  hint,
  hintId,
  errorId,
  errorMessage,
  placeholder,
}: AuthFieldProps) {
  return (
    <div className="auth-field space-y-2">
      <label
        className="inline-block py-1 -my-1 font-label-caps-sm text-label-caps-sm uppercase tracking-[0.16em] text-on-surface-variant"
        htmlFor={id}
      >
        <span>{label}</span>
        {required ? (
          <span aria-hidden="true" className="text-primary-fixed ml-1">
            *
          </span>
        ) : (
          <span className="text-outline ml-1.5 font-normal">(OPTIONAL)</span>
        )}
      </label>

      {hint && hintId ? (
        <p className="font-data-mono text-[11px] text-outline" id={hintId}>
          {hint}
        </p>
      ) : null}

      <input
        aria-describedby={hint && hintId ? hintId : undefined}
        aria-invalid="false"
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={autoCorrect}
        className="auth-input w-full bg-surface-container-highest px-4 py-3 font-data-mono text-on-surface placeholder:text-outline focus:outline-none"
        data-error={errorId}
        enterKeyHint={enterKeyHint}
        id={id}
        inputMode={inputMode}
        maxLength={maxLength}
        minLength={minLength}
        name={name}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        spellCheck={spellCheck}
        type={type}
        value={value}
      />

      <p
        className="auth-error-msg items-center gap-1.5 font-data-mono text-[11px] text-error pt-0.5"
        id={errorId}
      >
        <span
          aria-label="Error"
          className="material-symbols-outlined text-[15px] shrink-0"
          role="img"
        >
          error
        </span>
        <span>{errorMessage}</span>
      </p>
    </div>
  );
}

interface PasswordAuthFieldProps extends BaseFieldProps {
  autoComplete: 'current-password' | 'new-password';
  labelRightSlot?: React.ReactNode;
}

/**
 * Password field supporting native password managers, paste freedom, and an
 * accessible visibility toggle with screen-reader warning text.
 */
export function PasswordAuthField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete,
  required = true,
  minLength,
  enterKeyHint = 'done',
  hint,
  hintId,
  errorId,
  errorMessage,
  placeholder,
  labelRightSlot,
}: PasswordAuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const warningId = `${id}-toggle-warning`;

  return (
    <div className="auth-field space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          className="inline-block py-1 -my-1 font-label-caps-sm text-label-caps-sm uppercase tracking-[0.16em] text-on-surface-variant"
          htmlFor={id}
        >
          <span>{label}</span>
          {required ? (
            <span aria-hidden="true" className="text-primary-fixed ml-1">
              *
            </span>
          ) : null}
        </label>
        {labelRightSlot}
      </div>

      {hint && hintId ? (
        <p className="font-data-mono text-[11px] text-outline" id={hintId}>
          {hint}
        </p>
      ) : null}

      <div className="relative">
        <input
          aria-describedby={hint && hintId ? hintId : undefined}
          aria-invalid="false"
          autoComplete={autoComplete}
          className="auth-input w-full bg-surface-container-highest pl-4 pr-24 py-3 font-data-mono text-on-surface placeholder:text-outline focus:outline-none"
          data-error={errorId}
          enterKeyHint={enterKeyHint}
          id={id}
          minLength={minLength}
          name={name}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          type={visible ? 'text' : 'password'}
          value={value}
        />

        <button
          aria-describedby={warningId}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="auth-btn absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3 min-h-[44px] bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-data-mono text-[10px] uppercase tracking-[0.16em] transition-colors"
          onClick={() => setVisible((prev) => !prev)}
          type="button"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[16px]"
          >
            {visible ? 'visibility_off' : 'visibility'}
          </span>
          <span>{visible ? 'HIDE' : 'SHOW'}</span>
        </button>

        <span className="visually-hidden" id={warningId}>
          Warning: this will display your password on the screen.
        </span>
      </div>

      <p
        className="auth-error-msg items-center gap-1.5 font-data-mono text-[11px] text-error pt-0.5"
        id={errorId}
      >
        <span
          aria-label="Error"
          className="material-symbols-outlined text-[15px] shrink-0"
          role="img"
        >
          error
        </span>
        <span>{errorMessage}</span>
      </p>
    </div>
  );
}
