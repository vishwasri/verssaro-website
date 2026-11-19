'use client';

import React from 'react';
import Link from 'next/link';
import { HalftoneCanvas } from './HalftoneCanvas';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="ftr" id="footer">
      <div className="ftr__dots">
        <HalftoneCanvas
          options={{
            mode: 'emblem',
            ink: '#D9B25C',
            warm: '#FFF2CC',
            dotGap: 6,
            radius: 70,
            emblemScale: 0.8,
            emblemX: 0.85,
          }}
          className="w-full h-full"
        />
      </div>

      <div className="ftr__inner">
        <div className="ftr__brand">
          <img
            src="/assets/brand/Verssaro_Horizontal_Heritage_Gold.svg"
            alt="VERSSARO"
            className="h-10 w-auto object-contain mb-4"
          />
          <p>Sri Lankan heritage. Modern expression.</p>
        </div>

        <nav className="ftr__col" aria-label="Shop">
          <h3>Shop</h3>
          <a href="#collection">Collection</a>
          <a href="#selector">Selector</a>
          <a href="#studio">Studio</a>
          <Link href="/bag">Checkout Bag</Link>
        </nav>

        <nav className="ftr__col" aria-label="House">
          <h3>House</h3>
          <a href="#manifesto">The emblem</a>
          <a href="#lookbook">Lookbook</a>
          <a href="#craft">Packaging</a>
        </nav>

        <nav className="ftr__col" aria-label="Connect">
          <h3>Connect</h3>
          <a
            href="https://www.instagram.com/verssaro/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          <a href="#contact">Enquire</a>
          <button type="button" className="ftr__top" onClick={scrollToTop}>
            Back to top ↑
          </button>
        </nav>
      </div>

      <div className="ftr__base">
        <span>© 2026 VERSSARO · Sri Lanka</span>
        <span>Heritage × Apparel × Sri Lanka</span>
      </div>
    </footer>
  );
}
