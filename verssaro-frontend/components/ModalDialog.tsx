'use client';

import React, { useEffect, useRef } from 'react';

interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

/**
 * Native <dialog> modal adhering to top-layer accessibility & scroll containment.
 * Implements pointerdown + pointerup light-dismiss fallback outside the box.
 */
export function ModalDialog({
  open,
  onClose,
  titleId,
  children,
  maxWidthClass = 'max-w-3xl',
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pointerDownTargetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    onClose();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    pointerDownTargetRef.current = e.target;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (e.target === dialog && pointerDownTargetRef.current === dialog) {
      const rect = dialog.getBoundingClientRect();
      const clickedInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!clickedInDialog) {
        onClose();
      }
    }
    pointerDownTargetRef.current = null;
  };

  return (
    <dialog
      aria-labelledby={titleId}
      className={`w-full ${maxWidthClass} bg-surface-container-low text-on-surface shadow-2xl overflow-y-auto`}
      onCancel={handleCancel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      ref={dialogRef}
    >
      {open ? children : null}
    </dialog>
  );
}

