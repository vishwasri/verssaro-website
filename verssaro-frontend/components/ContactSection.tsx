'use client';

import React from 'react';

export function ContactSection({
  onOpenDrawer,
}: {
  onOpenDrawer: () => void;
}) {
  return (
    <section className="contact section" id="contact">
      <div className="contact__img" data-parallax="0.12">
        <img
          src="/assets/img/gift-set.webp"
          alt="VERSSARO gift set with bag, box, envelope and Guardian tee"
          loading="lazy"
        />
      </div>
      <div className="contact__body">
        <p className="eyebrow">
          <span className="eyebrow__line" />
          06 — Enquire
        </p>
        <h2 className="title title--md">
          <span className="thin">Order a piece,</span> <b>or a gift</b>
        </h2>
        <p>
          Choose your designs and sizes, then send one enquiry. Availability,
          pricing and delivery are confirmed personally.
        </p>
        <div className="contact__ctas">
          <button
            className="btn btn--gold"
            id="contactBag"
            onClick={onOpenDrawer}
          >
            <span>Open enquiry list</span>
            <svg viewBox="0 0 24 24" className="w-4 h-4 ml-2 fill-none stroke-current stroke-2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          <a
            className="btn btn--ghost"
            href="https://www.instagram.com/verssaro/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Message on Instagram</span>
          </a>
        </div>
      </div>
    </section>
  );
}
