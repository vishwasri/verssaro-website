'use client';

import { useCallback, useEffect, useRef } from 'react';

type FormFieldControl =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

interface InteractionState {
  hasInteracted: boolean;
  hasBlurred: boolean;
}

function isFieldControl(node: EventTarget | null): node is FormFieldControl {
  return (
    node instanceof HTMLInputElement ||
    node instanceof HTMLSelectElement ||
    node instanceof HTMLTextAreaElement
  );
}

/**
 * Links or unlinks `data-error` in `aria-describedby` solely while invalid so
 * hidden error text is never read prematurely before user interaction.
 */
function linkErrorToDescribedBy(el: FormFieldControl, shown: boolean): void {
  const errorId = el.dataset.error;
  if (!errorId) return;
  const ids = (el.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter((id) => id && id !== errorId);
  if (shown) ids.push(errorId);
  if (ids.length > 0) el.setAttribute('aria-describedby', ids.join(' '));
  else el.removeAttribute('aria-describedby');
}

function setFieldWrapperInvalid(el: FormFieldControl, invalid: boolean): void {
  const wrapper = el.closest('.auth-field');
  if (wrapper instanceof HTMLElement) {
    if (invalid) wrapper.dataset.invalid = 'true';
    else delete wrapper.dataset.invalid;
  }
}

function getSpokenText(node: HTMLElement): string {
  const copy = node.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  copy
    .querySelectorAll('[role="img"][aria-label]')
    .forEach((n) =>
      n.replaceWith(`${n.getAttribute('aria-label') || 'Error'}: `),
    );
  return (copy.textContent || '').replace(/\s+/g, ' ').trim();
}

/**
 * Synchronizes post-interaction HTML5 constraint validity with `:user-invalid`
 * (and a WeakMap interaction fallback), `aria-invalid`, dynamic
 * `aria-describedby` linking, polite live-region announcements, and focus routing
 * to the first invalid control on submit.
 */
export function useAccessibleFormValidation() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const validateSubmitRef = useRef<() => boolean>(() => true);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const dirtyState = new WeakMap<FormFieldControl, InteractionState>();
    const announced = new WeakSet<FormFieldControl>();
    const flagged = new WeakSet<FormFieldControl>();

    const supportsUserInvalid =
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('selector(:user-invalid)');

    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.className = 'visually-hidden';
    document.body.appendChild(announcer);

    let announceTimer: ReturnType<typeof setTimeout> | undefined;
    let announcedField: FormFieldControl | undefined;

    const announceError = (el: FormFieldControl) => {
      const errorId = el.dataset.error;
      if (!errorId) return;
      const errorEl = document.getElementById(errorId);
      if (!errorEl) return;

      const labelEl = el.labels?.[0];
      const labelPrefix = labelEl ? `${getSpokenText(labelEl)}: ` : '';
      clearTimeout(announceTimer);
      announcer.textContent = '';
      announcedField = el;
      // Delay slightly so screen readers finish announcing the newly focused element.
      announceTimer = setTimeout(() => {
        announcer.textContent = labelPrefix + getSpokenText(errorEl);
      }, 500);
    };

    const syncControl = (
      el: FormFieldControl,
      options: { announce?: boolean; forceSubmitCheck?: boolean } = {},
    ) => {
      const { announce = false, forceSubmitCheck = false } = options;
      const state = dirtyState.get(el) || {
        hasInteracted: false,
        hasBlurred: false,
      };
      const nativeUserInvalid = supportsUserInvalid
        ? el.matches(':user-invalid')
        : false;
      const shouldEvaluate =
        nativeUserInvalid ||
        forceSubmitCheck ||
        (state.hasInteracted && state.hasBlurred);

      const isInvalid = shouldEvaluate ? !el.validity.valid : false;

      if (isInvalid) {
        if (announce && !announced.has(el)) {
          announceError(el);
          announced.add(el);
        }
        el.classList.add('user-invalid-fallback');
        el.classList.remove('user-valid-fallback');
        el.setAttribute('aria-invalid', 'true');
        linkErrorToDescribedBy(el, true);
        setFieldWrapperInvalid(el, true);
        flagged.add(el);
      } else if (flagged.has(el) || el.getAttribute('aria-invalid') !== 'true') {
        el.classList.remove('user-invalid-fallback');
        if (state.hasBlurred && state.hasInteracted && el.validity.valid) {
          el.classList.add('user-valid-fallback');
        } else {
          el.classList.remove('user-valid-fallback');
        }
        el.setAttribute('aria-invalid', 'false');
        linkErrorToDescribedBy(el, false);
        setFieldWrapperInvalid(el, false);
        flagged.delete(el);
        announced.delete(el);
        if (announcedField === el) {
          clearTimeout(announceTimer);
          announcer.textContent = '';
        }
      }
    };

    Array.from(form.elements).forEach((el) => {
      if (isFieldControl(el)) {
        el.setAttribute('aria-invalid', 'false');
        syncControl(el);
      }
    });

    const onBlur = (e: FocusEvent) => {
      if (!isFieldControl(e.target)) return;
      const state = dirtyState.get(e.target) || {
        hasInteracted: false,
        hasBlurred: false,
      };
      state.hasBlurred = true;
      dirtyState.set(e.target, state);
      syncControl(e.target, { announce: true });
    };

    const onInput = (e: Event) => {
      if (!isFieldControl(e.target)) return;
      const state = dirtyState.get(e.target) || {
        hasInteracted: false,
        hasBlurred: false,
      };
      state.hasInteracted = true;
      dirtyState.set(e.target, state);
      if (state.hasBlurred || e.target.getAttribute('aria-invalid') === 'true') {
        syncControl(e.target);
      }
    };

    const onChange = (e: Event) => {
      if (!isFieldControl(e.target)) return;
      const state = dirtyState.get(e.target) || {
        hasInteracted: false,
        hasBlurred: false,
      };
      state.hasInteracted = true;
      state.hasBlurred = true;
      dirtyState.set(e.target, state);
      syncControl(e.target, { announce: true });
    };

    const onInvalid = (e: Event) => {
      if (!isFieldControl(e.target)) return;
      e.preventDefault();
      dirtyState.set(e.target, { hasInteracted: true, hasBlurred: true });
      announced.add(e.target);
      syncControl(e.target, { forceSubmitCheck: true });
    };

    const onReset = () => {
      clearTimeout(announceTimer);
      announcer.textContent = '';
      setTimeout(() => {
        Array.from(form.elements).forEach((el) => {
          if (!isFieldControl(el)) return;
          dirtyState.delete(el);
          announced.delete(el);
          flagged.delete(el);
          el.classList.remove('user-invalid-fallback', 'user-valid-fallback');
          el.setAttribute('aria-invalid', 'false');
          linkErrorToDescribedBy(el, false);
          setFieldWrapperInvalid(el, false);
        });
      });
    };

    validateSubmitRef.current = () => {
      let firstInvalid: FormFieldControl | null = null;
      Array.from(form.elements).forEach((el) => {
        if (!isFieldControl(el)) return;
        const valid = el.checkValidity();
        if (!valid) {
          dirtyState.set(el, { hasInteracted: true, hasBlurred: true });
          announced.add(el);
          syncControl(el, { forceSubmitCheck: true });
          if (!firstInvalid) firstInvalid = el;
        }
      });
      if (firstInvalid) {
        (firstInvalid as FormFieldControl).focus();
        return false;
      }
      return true;
    };

    form.addEventListener('blur', onBlur, true);
    form.addEventListener('input', onInput);
    form.addEventListener('change', onChange, true);
    form.addEventListener('invalid', onInvalid, true);
    form.addEventListener('reset', onReset, true);

    return () => {
      clearTimeout(announceTimer);
      form.removeEventListener('blur', onBlur, true);
      form.removeEventListener('input', onInput);
      form.removeEventListener('change', onChange, true);
      form.removeEventListener('invalid', onInvalid, true);
      form.removeEventListener('reset', onReset, true);
      announcer.remove();
    };
  }, []);

  const validateBeforeSubmit = useCallback(() => {
    return validateSubmitRef.current();
  }, []);

  return { formRef, validateBeforeSubmit };
}

