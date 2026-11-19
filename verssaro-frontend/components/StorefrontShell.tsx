'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { CurrencyCode } from '@/lib/types';
import { ModalDialog } from './ModalDialog';
import { useStore } from './StoreContext';
import { VerssaroMark } from './VerssaroMark';

const NAV_LINKS = [
  { href: '/shop', label: 'COLLECTION' },
  { href: '/editorial', label: 'EDITORIAL' },
  { href: '/about', label: 'THE ATELIER' },
  { href: '/account', label: 'PATRON DOSSIER' },
  { href: '/admin', label: 'ATELIER HQ' },
];

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    cart,
    wishlist,
    dossier,
    isAuthenticated,
    currency,
    setCurrency,
    signOut,
    announce,
  } = useStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [conciergeInput, setConciergeInput] = useState('');
  const [conciergeMessages, setConciergeMessages] = useState([
    {
      sender: 'SARA K. // SENIOR LIAISON',
      text: 'Welcome to VERSSARO Colombo Flagship Concierge. Ask regarding 320–520 GSM sizing, express courier windows, or private Tier 01 allocations.',
    },
  ]);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterTouched, setNewsletterTouched] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);

  // Mobile navigation drawer (<dialog> + IntersectionObserver source of truth)
  const drawerDialogRef = useRef<HTMLDialogElement>(null);
  const drawerScrollerRef = useRef<HTMLDivElement>(null);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openMobileDrawer = () => {
    const d = drawerDialogRef.current;
    const scroller = drawerScrollerRef.current;
    if (!d) return;
    setDrawerOpen(true);
    if (!d.open) d.showModal();
    requestAnimationFrame(() => {
      scroller?.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior });
    });
  };

  const closeMobileDrawer = () => {
    const d = drawerDialogRef.current;
    if (d?.open) d.close();
    setDrawerOpen(false);
  };

  useEffect(() => {
    const panel = drawerPanelRef.current;
    const scroller = drawerScrollerRef.current;
    if (!panel || !scroller) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting && drawerDialogRef.current?.open) {
            closeMobileDrawer();
          }
        }
      },
      { root: scroller, threshold: 0.1 },
    );
    observer.observe(panel);
    return () => observer.disconnect();
  }, [drawerOpen]);

  // Close mobile drawer when route changes
  useEffect(() => {
    const d = drawerDialogRef.current;
    if (d?.open) d.close();
    queueMicrotask(() => setDrawerOpen(false));
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterTouched(true);
    const email = newsletterEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNewsletterStatus('ENTER A VALID EMAIL ADDRESS FOR EARLY ACCESS.');
      return;
    }
    try {
      await apiFetch('/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email, source: 'FOOTER_INNER_CIRCLE' }),
      });
      setNewsletterStatus('ACCESS GRANTED // REGISTERED TO INNER CIRCLE.');
      setNewsletterEmail('');
      setNewsletterTouched(false);
      announce('REGISTERED FOR VERSSARO INNER CIRCLE DROPS');
    } catch (err: unknown) {
      setNewsletterStatus(getErrorMessage(err, 'UNABLE TO REGISTER EMAIL'));
    }
  };

  const sendConciergeMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const txt = conciergeInput.trim();
    if (!txt) return;
    setConciergeMessages((prev) => [
      ...prev,
      { sender: 'YOU // CLIENT DOSSIER', text: txt },
      {
        sender: 'SARA K. // SENIOR LIAISON',
        text: 'Confirmed. All Archive 01 & Capsule 04 pieces ship within 2 hours from Colombo Flagship #01. Take your true size for architectural boxy drape.',
      },
    ]);
    setConciergeInput('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      {/* Top Announcement & Utility Header */}
      <header className="fixed top-0 inset-x-0 z-40">
        {/* Announcement Strip */}
        <div className="h-8 bg-surface-container-lowest flex items-center justify-between px-margin-mobile md:px-margin text-[10px] font-label-caps-sm uppercase tracking-[0.2em] text-on-surface-variant">
          <span className="truncate">
            FREE COLOMBO DISPATCH // FREE GLOBAL DHL EXPRESS OVER $400 USD
          </span>
          <div className="hidden md:flex items-center gap-4 shrink-0">
            <Link
              className="hover:text-on-surface transition-colors"
              href="/account"
            >
              VIP DOSSIER
            </Link>
            <span className="text-outline-variant">/</span>
            <Link
              className="hover:text-on-surface transition-colors"
              href="/about"
            >
              AUTHENTIC HERITAGE
            </Link>
          </div>
        </div>

        {/* Main 72px Glassmorphic Bar */}
        <div className="h-18 bg-surface/85 backdrop-blur-xl px-margin-mobile md:px-margin flex items-center justify-between gap-4">
          {/* Mobile Menu Trigger + Brand */}
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation menu"
              className="lg:hidden p-1.5 text-on-surface hover:bg-surface-container-high transition-colors"
              onClick={openMobileDrawer}
              type="button"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <Link
              className="flex items-center gap-2.5 text-on-surface hover:opacity-90 transition-opacity"
              href="/"
            >
              <VerssaroMark className="w-6 h-6" />
              <span className="font-display-xl text-xl tracking-[-0.04em] uppercase">
                VERSSARO
              </span>
            </Link>
          </div>

          {/* Primary Editorial Navigation */}
          <nav
            aria-label="Primary Storefront Navigation"
            className="hidden lg:flex items-center gap-6"
          >
            {NAV_LINKS.map((item) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href.split('?')[0]);
              return (
                <Link
                  className={`font-label-caps-sm text-[11px] uppercase tracking-[0.16em] transition-colors whitespace-nowrap ${
                    active
                      ? 'text-on-surface underline underline-offset-8 decoration-1'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Utility Cluster: Search, Currency, Wishlist, Dossier, Bag */}
          <div className="flex items-center gap-2 md:gap-4">
            <label className="visually-hidden" htmlFor="header-currency-select">
              Select display currency
            </label>
            <select
              className="bg-surface-container-low text-on-surface font-data-mono text-[11px] uppercase px-2 py-1 focus:outline-none cursor-pointer"
              id="header-currency-select"
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              value={currency}
            >
              <option value="USD">USD ($)</option>
              <option value="LKR">LKR</option>
              <option value="EUR">EUR (€)</option>
            </select>

            <button
              aria-label="Open archive catalog search"
              className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={() => setSearchOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                search
              </span>
            </button>

            <Link
              aria-label="Saved Archive Wishlist"
              className="relative p-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
              href="/wishlist"
            >
              <span className="material-symbols-outlined text-[20px]">
                favorite
              </span>
              {wishlist.length > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-surface-container-highest text-on-surface font-data-mono text-[9px] flex items-center justify-center">
                  {wishlist.length}
                </span>
              ) : null}
            </Link>

            <Link
              aria-label={
                isAuthenticated && dossier
                  ? `Client dossier for ${dossier.name}`
                  : 'Client Dossier & Orders'
              }
              className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors hidden sm:inline-flex"
              href="/account"
            >
              <span className="material-symbols-outlined text-[20px]">
                person
              </span>
            </Link>

            {isAuthenticated ? (
              <button
                className="hidden md:inline-flex px-2.5 py-1.5 font-label-caps-sm text-[11px] uppercase tracking-[0.16em] text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap"
                onClick={signOut}
                type="button"
              >
                SIGN OUT
              </button>
            ) : (
              <Link
                className={`hidden md:inline-flex px-2.5 py-1.5 font-label-caps-sm text-[11px] uppercase tracking-[0.16em] transition-colors whitespace-nowrap ${
                  pathname === '/signin' || pathname === '/signup'
                    ? 'text-on-surface underline underline-offset-4'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                href="/signin"
              >
                SIGN IN
              </Link>
            )}

            <Link
              aria-label={`Shopping bag with ${cart?.itemCount ?? 0} items`}
              className="flex items-center gap-1.5 bg-on-surface text-surface px-3 py-1.5 hover:bg-primary-fixed transition-colors"
              href="/bag"
            >
              <span className="material-symbols-outlined text-[18px]">
                shopping_bag
              </span>
              <span className="font-data-mono text-[11px] font-bold uppercase tracking-wider">
                BAG ({cart?.itemCount ?? 0})
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Slot */}
      <div className="flex-1 flex flex-col" id="main-content" tabIndex={-1}>
        {children}
      </div>

      {/* Floating Concierge CTA */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          aria-label="Open Atelier Concierge liaison"
          className="bg-surface-container-highest hover:bg-on-surface text-on-surface hover:text-surface px-4 py-3 shadow-2xl flex items-center gap-2 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors"
          onClick={() => setConciergeOpen(true)}
          type="button"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">CONCIERGE LIAISON</span>
          <span className="material-symbols-outlined text-base">forum</span>
        </button>
      </div>

      {/* 5-Column Brutalist Atelier Footer */}
      <footer className="bg-surface-container-lowest pt-16 pb-10 px-margin-mobile md:px-margin mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 pb-12">
          {/* Col 1: Brand Statement */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5 text-on-surface">
              <VerssaroMark className="w-6 h-6" />
              <span className="font-display-xl text-2xl tracking-[-0.04em] uppercase">
                VERSSARO
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm leading-relaxed">
              Architectural heavyweight streetwear engineered in Colombo. Crafted
              with custom 320–520 GSM organic fabrics, matte monolithic silhouettes,
              and passive HF NFC silicon provenance.
            </p>
            <div className="font-data-mono text-[11px] text-outline uppercase space-y-1 pt-2">
              <p>ATELIER FLAGSHIP // 42 ALFRED HOUSE GARDENS, COLOMBO 03</p>
              <p>CONCIERGE DIRECT // +94 77 112 3456</p>
            </div>
          </div>

          {/* Col 2: Shop */}
          <div className="md:col-span-2 space-y-3">
            <h2 className="font-label-caps-sm text-label-caps-sm text-on-surface uppercase tracking-[0.2em]">
              ARCHIVE SHOP
            </h2>
            <ul className="space-y-2 font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <Link className="hover:text-on-surface" href="/shop">
                  All Apparel
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-on-surface"
                  href="/shop?category=tees"
                >
                  Heavyweight Tees
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-on-surface"
                  href="/shop?category=hoodies"
                >
                  520 GSM Fleece
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-on-surface"
                  href="/shop?category=cargo"
                >
                  Tactical Cargos
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-on-surface"
                  href="/shop?category=outerwear"
                >
                  Technical Shells
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Dossier */}
          <div className="md:col-span-2 space-y-3">
            <h2 className="font-label-caps-sm text-label-caps-sm text-on-surface uppercase tracking-[0.2em]">
              CLIENT DOSSIER
            </h2>
            <ul className="space-y-2 font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <Link className="hover:text-on-surface" href="/account">
                  Orders &amp; History
                </Link>
              </li>
              <li>
                <Link className="hover:text-on-surface" href="/about">
                  Heritage Atelier
                </Link>
              </li>
              <li>
                <Link className="hover:text-on-surface" href="/wishlist">
                  Saved Archive
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-on-surface"
                  href="/account/addresses"
                >
                  Shipping Addresses
                </Link>
              </li>
              <li>
                <Link className="hover:text-on-surface" href="/signin">
                  Sign In
                </Link>
              </li>
              <li>
                <Link className="hover:text-on-surface" href="/signup">
                  Create Account
                </Link>
              </li>
              <li>
                <Link className="hover:text-on-surface" href="/admin">
                  Atelier HQ Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4-5: Inner Circle Subscription */}
          <div className="md:col-span-4 space-y-4">
            <h2 className="font-label-caps-sm text-label-caps-sm text-on-surface uppercase tracking-[0.2em]">
              ACCESS THE UNRELEASED // INNER CIRCLE
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Receive private 24-hour smart-contract whitelist keys ahead of
              Archive 02 drops.
            </p>
            <form
              className="flex flex-col gap-2"
              noValidate
              onSubmit={(e) => void handleNewsletterSubmit(e)}
            >
              <label className="visually-hidden" htmlFor="footer-newsletter-email">
                Email address for unreleased drop access
              </label>
              <div className="flex">
                <input
                  autoComplete="email"
                  className={`flex-1 bg-surface-container-low px-4 py-3 font-data-mono text-data-mono text-on-surface placeholder:text-outline focus:outline-none ${
                    newsletterTouched ? 'user-invalid-fallback' : ''
                  }`}
                  id="footer-newsletter-email"
                  name="email"
                  onBlur={() => setNewsletterTouched(true)}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="ENTER YOUR EMAIL"
                  required
                  type="email"
                  value={newsletterEmail}
                />
                <button
                  className="bg-on-surface text-surface hover:bg-primary-fixed px-5 py-3 font-label-caps-sm text-[11px] uppercase tracking-widest font-bold transition-colors shrink-0"
                  type="submit"
                >
                  JOIN
                </button>
              </div>
              {newsletterStatus ? (
                <p
                  aria-live="polite"
                  className="font-data-mono text-[11px] text-primary-fixed uppercase"
                >
                  {newsletterStatus}
                </p>
              ) : null}
            </form>
          </div>
        </div>

        {/* Bottom Legal & System Line */}
        <div className="max-w-7xl mx-auto pt-6 bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-4 font-data-mono text-[11px] text-outline uppercase tracking-wider">
          <p>© 2025 VERSSARO ATELIER PRIVATE LIMITED. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-6">
            <Link className="hover:text-on-surface" href="/about">
              PHILOSOPHY
            </Link>
            <Link className="hover:text-on-surface" href="/client-care">
              CARE &amp; RETURNS
            </Link>
            <Link className="hover:text-on-surface" href="/privacy">
              PRIVACY
            </Link>
            <Link className="hover:text-on-surface" href="/terms">
              TERMS
            </Link>
          </div>
        </div>
      </footer>

      {/* Mobile Scroll-Snap Navigation Drawer (<dialog>) */}
      <dialog
        aria-label="Mobile Navigation"
        className="Drawer"
        onCancel={(e) => {
          e.preventDefault();
          closeMobileDrawer();
        }}
        ref={drawerDialogRef}
      >
        <div className="Drawer-scroller" ref={drawerScrollerRef}>
          <div
            className="Drawer-panel bg-surface-container-low p-6 flex flex-col justify-between shadow-2xl"
            ref={drawerPanelRef}
          >
            <div>
              <div className="flex items-center justify-between pb-6 mb-6 bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <VerssaroMark className="w-5 h-5" />
                  <span className="font-display-xl text-lg uppercase">
                    VERSSARO
                  </span>
                </div>
                <button
                  aria-label="Close navigation menu"
                  className="p-1.5 text-on-surface hover:bg-surface-container-high"
                  onClick={closeMobileDrawer}
                  type="button"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <nav aria-label="Mobile links" className="flex flex-col gap-3">
                {NAV_LINKS.map((item) => (
                  <Link
                    className="py-2.5 px-3 bg-surface-container font-label-caps-lg text-label-caps-lg uppercase tracking-widest text-on-surface hover:bg-surface-container-high"
                    href={item.href}
                    key={item.href}
                    onClick={closeMobileDrawer}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  className="py-2.5 px-3 bg-surface-container font-label-caps-lg text-label-caps-lg uppercase tracking-widest text-on-surface hover:bg-surface-container-high"
                  href="/account"
                  onClick={closeMobileDrawer}
                >
                  CLIENT DOSSIER
                </Link>
                <Link
                  className="py-2.5 px-3 bg-surface-container font-label-caps-lg text-label-caps-lg uppercase tracking-widest text-on-surface hover:bg-surface-container-high"
                  href="/wishlist"
                  onClick={closeMobileDrawer}
                >
                  SAVED WISHLIST ({wishlist.length})
                </Link>
                {isAuthenticated ? (
                  <button
                    className="text-left py-2.5 px-3 bg-surface-container font-label-caps-lg text-label-caps-lg uppercase tracking-widest text-on-surface hover:bg-surface-container-high"
                    onClick={() => {
                      signOut();
                      closeMobileDrawer();
                    }}
                    type="button"
                  >
                    SIGN OUT DOSSIER
                  </button>
                ) : (
                  <>
                    <Link
                      className="py-2.5 px-3 bg-surface-container font-label-caps-lg text-label-caps-lg uppercase tracking-widest text-on-surface hover:bg-surface-container-high"
                      href="/signin"
                      onClick={closeMobileDrawer}
                    >
                      SIGN IN
                    </Link>
                    <Link
                      className="py-2.5 px-3 bg-on-surface text-surface font-label-caps-lg text-label-caps-lg uppercase tracking-widest hover:bg-primary-fixed"
                      href="/signup"
                      onClick={closeMobileDrawer}
                    >
                      CREATE ACCOUNT
                    </Link>
                  </>
                )}
              </nav>
            </div>
            <div className="pt-6 font-data-mono text-[11px] text-outline uppercase">
              COLOMBO ATELIER // SWIPE LEFT TO DISMISS
            </div>
          </div>
          <div
            aria-hidden="true"
            className="Drawer-dismissZone"
            onClick={closeMobileDrawer}
          />
        </div>
      </dialog>

      {/* Catalog Search Overlay Dialog */}
      <ModalDialog
        maxWidthClass="max-w-2xl"
        onClose={() => setSearchOpen(false)}
        open={searchOpen}
        titleId="search-modal-title"
      >
        <div className="p-6 md:p-8 bg-surface-container-low space-y-6">
          <div className="flex items-center justify-between">
            <h2
              className="font-headline-sm text-headline-sm uppercase text-on-surface"
              id="search-modal-title"
            >
              SEARCH ARCHIVE MATRIX
            </h2>
            <button
              aria-label="Close search modal"
              className="p-1.5 text-outline hover:text-on-surface"
              onClick={() => setSearchOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <search>
            <form className="flex gap-2" onSubmit={handleSearchSubmit}>
              <label className="visually-hidden" htmlFor="global-search-input">
                Search garments, GSM weight, SKU, or capsule
              </label>
              <input
                autoFocus
                className="flex-1 bg-surface-container-lowest px-4 py-3 font-data-mono text-data-mono text-on-surface placeholder:text-outline focus:outline-none uppercase"
                id="global-search-input"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH TEE, BOMBER, 520 GSM, SKU..."
                type="search"
                value={searchQuery}
              />
              <button
                className="bg-on-surface text-surface px-6 py-3 font-label-caps-lg text-label-caps-lg uppercase font-bold"
                type="submit"
              >
                QUERY
              </button>
            </form>
          </search>
          <div className="flex flex-wrap gap-2">
            {['Oversized Tee', 'Hoodie', 'Cargo', 'Bomber', 'Trench'].map(
              (term) => (
                <button
                  className="bg-surface-container-high hover:bg-surface-bright px-3 py-1.5 font-data-mono text-[11px] uppercase text-on-surface-variant"
                  key={term}
                  onClick={() => {
                    setSearchOpen(false);
                    router.push(`/shop?q=${encodeURIComponent(term)}`);
                  }}
                  type="button"
                >
                  {term}
                </button>
              ),
            )}
          </div>
        </div>
      </ModalDialog>

      {/* Atelier Concierge Dialog */}
      <ModalDialog
        maxWidthClass="max-w-lg"
        onClose={() => setConciergeOpen(false)}
        open={conciergeOpen}
        titleId="concierge-modal-title"
      >
        <div className="bg-surface-container-low p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 bg-surface-container-lowest -mx-6 -mt-6 px-6 py-4">
            <div>
              <span className="font-data-mono text-[10px] text-emerald-400 uppercase tracking-widest">
                ● ENCRYPTED COLOMBO DISPATCH LIAISON
              </span>
              <h2
                className="font-headline-sm text-headline-sm uppercase text-on-surface mt-0.5"
                id="concierge-modal-title"
              >
                ATELIER CONCIERGE DESK
              </h2>
            </div>
            <button
              aria-label="Close concierge"
              className="p-1.5 text-outline hover:text-on-surface"
              onClick={() => setConciergeOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {conciergeMessages.map((msg, idx) => (
              <div className="bg-surface-container p-3 space-y-1" key={idx}>
                <span className="font-data-mono text-[10px] text-outline uppercase">
                  {msg.sender}
                </span>
                <p className="font-body-sm text-body-sm text-on-surface">
                  {msg.text}
                </p>
              </div>
            ))}
          </div>

          <form className="flex gap-2" onSubmit={sendConciergeMessage}>
            <label className="visually-hidden" htmlFor="concierge-msg-input">
              Message atelier stylist
            </label>
            <input
              className="flex-1 bg-surface-container-lowest px-3 py-2.5 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none"
              id="concierge-msg-input"
              onChange={(e) => setConciergeInput(e.target.value)}
              placeholder="Ask sizing, NFC transfer, or courier..."
              type="text"
              value={conciergeInput}
            />
            <button
              className="bg-on-surface text-surface px-4 py-2.5 font-label-caps-sm text-[11px] uppercase font-bold"
              type="submit"
            >
              SEND
            </button>
          </form>

          <div className="pt-2 flex items-center justify-between font-data-mono text-[11px] text-outline uppercase">
            <span>VIP TIER 01 PRIORITY SLA: &lt; 5 MIN</span>
            <Link
              className="text-on-surface underline"
              href="/account"
              onClick={() => setConciergeOpen(false)}
            >
              OPEN DOSSIER
            </Link>
          </div>
        </div>
      </ModalDialog>
    </div>
  );
}
