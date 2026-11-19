'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from './StoreContext';

export function Header({
  onOpenDrawer,
}: {
  onOpenDrawer: () => void;
}) {
  const { cart } = useStore();
  const [isSolid, setIsSolid] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const itemCount = cart?.items.reduce((s, it) => s + it.quantity, 0) || 0;

  useEffect(() => {
    let lastY = window.scrollY;

    const handleScroll = () => {
      const sy = window.scrollY;
      const vh = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight - vh;

      setScrollProgress(docHeight > 0 ? sy / docHeight : 0);
      setIsSolid(sy > vh * 0.3);

      const vel = sy - lastY;
      lastY = sy;

      if (sy > vh && vel > 8 && !menuOpen) {
        setIsHidden(true);
      } else if (vel < -8 || sy < vh) {
        setIsHidden(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuOpen]);

  return (
    <>
      <header
        className={`hdr ${isSolid ? 'is-solid' : ''} ${isHidden ? 'is-hidden' : ''}`}
        id="hdr"
      >
        <nav className="hdr__nav" aria-label="Primary">
          <a href="#collection">Collection</a>
          <a href="#selector">Selector</a>
          <a href="#studio">Studio</a>
          <a href="#lookbook">Lookbook</a>
          <a href="#craft">Craft</a>
        </nav>

        <button
          className="hdr__burger"
          id="burger"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
        </button>

        <a className="hdr__logo" href="#top" aria-label="VERSSARO home">
          <img
            src="/assets/brand/Verssaro_Horizontal_Heritage_Gold.svg"
            alt="VERSSARO"
            className="h-8 md:h-10 w-auto object-contain"
          />
        </a>

        <div className="hdr__right">
          <a
            className="hdr__ig"
            href="https://www.instagram.com/verssaro/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="VERSSARO on Instagram"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-none stroke-current stroke-[1.5]">
              <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.3" cy="6.7" r=".9" fill="currentColor" />
            </svg>
          </a>

          <button
            className="hdr__bag"
            id="bagBtn"
            onClick={onOpenDrawer}
            aria-label="Open enquiry and shopping bag"
          >
            Enquiry <span className="hdr__count">{itemCount}</span>
          </button>
        </div>

        <span
          className="hdr__progress"
          id="progress"
          style={{ transform: `scaleX(${scrollProgress})` }}
        />
      </header>

      {/* Mobile Slide-over Menu */}
      <div
        className={`menu ${menuOpen ? 'is-open' : ''}`}
        id="menu"
        aria-hidden={!menuOpen}
      >
        <nav>
          <a href="#collection" onClick={() => setMenuOpen(false)}>
            <i>01</i>Collection
          </a>
          <a href="#selector" onClick={() => setMenuOpen(false)}>
            <i>02</i>Selector
          </a>
          <a href="#studio" onClick={() => setMenuOpen(false)}>
            <i>03</i>Studio
          </a>
          <a href="#lookbook" onClick={() => setMenuOpen(false)}>
            <i>04</i>Lookbook
          </a>
          <a href="#craft" onClick={() => setMenuOpen(false)}>
            <i>05</i>Craft
          </a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>
            <i>06</i>Contact
          </a>
          <div className="pt-6 border-t border-[#f3ecde]/10 flex flex-col gap-4">
            <Link
              href="/bag"
              className="text-xs uppercase tracking-widest text-[#d9b25c]"
              onClick={() => setMenuOpen(false)}
            >
              Direct Checkout Bag ({itemCount}) →
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
