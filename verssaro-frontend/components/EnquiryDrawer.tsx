'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from './StoreContext';
import { apiFetch } from '@/lib/api';
import { ARM_PATH } from './VerssaroLogo';

export function EnquiryDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { cart, updateCartQty, removeCartItem, announce } = useStore();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const items = cart?.items || [];
  const whatsappNumber = '94771234567'; // configurable WhatsApp
  const orderEmail = 'concierge@verssaro.vip';

  const generateMessage = () => {
    const lines = items.map(
      (x) => `• ${x.name} — size ${x.size} × ${x.quantity}`,
    );
    return `Hello VERSSARO,${name ? ` this is ${name}.` : ''}\nI would like to enquire about:\n${lines.join(
      '\n',
    )}${note ? `\n\nNotes: ${note}` : ''}\n\nThank you.`;
  };

  const handleWhatsApp = () => {
    const msg = generateMessage();
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`,
      '_blank',
    );
  };

  const handleEmail = () => {
    const msg = generateMessage();
    window.location.href = `mailto:${orderEmail}?subject=${encodeURIComponent(
      'VERSSARO Enquiry',
    )}&body=${encodeURIComponent(msg)}`;
  };

  const handleCopy = () => {
    const msg = generateMessage();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg).then(() => {
        announce('Enquiry message copied to clipboard');
      });
    } else {
      prompt('Copy your enquiry message:', msg);
    }
  };

  const handleSubmitEnquiry = async () => {
    if (!name.trim()) {
      announce('Please enter your name to submit an enquiry', 'error');
      return;
    }
    if (items.length === 0) {
      announce('Your enquiry list is empty', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch('/enquiries', {
        method: 'POST',
        body: JSON.stringify({
          customerName: name.trim(),
          notes: note.trim(),
          source: 'WEBSITE_DRAWER',
          items: items.map((it) => ({
            productId: it.productId,
            name: it.name,
            size: it.size,
            colorName: it.colorName,
            quantity: it.quantity,
          })),
        }),
      });
      announce('Enquiry submitted successfully! Our atelier will contact you.');
      onClose();
    } catch {
      announce('Enquiry submitted. Opening WhatsApp...', 'default');
      handleWhatsApp();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside
      className="drawer is-open"
      id="drawer"
      aria-label="Enquiry list"
      aria-hidden="false"
    >
      <div className="drawer__backdrop" onClick={onClose} />
      <div className="drawer__panel">
        <div className="drawer__head">
          <h3>Enquiry list</h3>
          <button onClick={onClose} aria-label="Close enquiry list">
            ✕
          </button>
        </div>

        {/* Items List */}
        <div className="drawer__items" id="drawerItems">
          {items.length > 0 ? (
            items.map((it) => (
              <div key={it.id} className="item">
                <img
                  src={it.imageUrl || '/assets/img/p-guardian.webp'}
                  alt={it.name}
                />
                <div>
                  <p className="item__n">{it.name}</p>
                  <p className="item__m">
                    {it.colorName} · Size {it.size}
                  </p>
                  <div className="qty">
                    <button
                      onClick={() => updateCartQty(it.id, it.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span>{it.quantity}</span>
                    <button
                      onClick={() => updateCartQty(it.id, it.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  className="item__x"
                  onClick={() => removeCartItem(it.id)}
                  aria-label={`Remove ${it.name}`}
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div className="empty">
              <svg
                viewBox="-130 -130 260 260"
                className="empty__emb w-16 h-16 mx-auto mb-4 text-[#d9b25c]"
                fill="currentColor"
              >
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <path
                    key={deg}
                    d={ARM_PATH}
                    transform={`rotate(${deg})`}
                  />
                ))}
              </svg>
              <p>Your enquiry list is empty.</p>
              <a href="#collection" onClick={onClose} className="link">
                Browse the collection →
              </a>
            </div>
          )}
        </div>

        {/* Drawer Footer & Actions */}
        {items.length > 0 && (
          <div className="drawer__foot">
            <label className="field">
              <span>Your Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lakshitha Silva"
                autoComplete="name"
              />
            </label>
            <label className="field">
              <span>Notes (city, gift, timing)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Need delivery to Colombo 07 by Friday"
                rows={2}
              />
            </label>

            <div className="drawer__actions">
              <button
                type="button"
                className="btn btn--gold btn--full"
                onClick={handleWhatsApp}
              >
                <span>Send via WhatsApp</span>
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--full"
                onClick={handleSubmitEnquiry}
                disabled={isSubmitting}
              >
                <span>
                  {isSubmitting ? 'Submitting...' : 'Submit to Atelier'}
                </span>
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--full"
                onClick={handleCopy}
              >
                <span>Copy enquiry message</span>
              </button>

              {/* Direct Checkout Integration */}
              <div className="pt-2 border-t border-[#f3ecde]/10 mt-1">
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="flex items-center justify-between text-xs tracking-wider uppercase text-[#d9b25c] hover:text-[#fff] p-2 bg-[#191816] transition-colors"
                >
                  <span>Or Proceed to Direct Checkout</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            <p className="drawer__small">
              Availability, pricing and delivery are confirmed on enquiry.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
