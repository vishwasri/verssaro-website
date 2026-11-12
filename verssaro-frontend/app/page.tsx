'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { StorefrontShell } from '@/components/StorefrontShell';
import { useStore } from '@/components/StoreContext';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { Product } from '@/lib/types';

const HERO_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBE6e6EBQKUJ1eczzDqIzFFmY9Ga3i3IqC6R7oo7HbmFgwUQZm15E2EeipoL61ktTqpdr6S30OYGHt4uAgnvQ-hHOIgWhrhzBle1mYkU1ciBGTNeDMDjNKyAZd0N1yNFQguXo1GWqG7WnLxWrzeXFkwR12FtY7X32jFRezQdvT3LyFzqMcYDNxINWETrqYXywJiPmKTsllk11oB3p-_nUe4j0T57YBhoRZh5YrJI4Q';

const FOUNDATIONS = [
  {
    title: 'ESSENTIAL HEAVY TEES',
    subtitle: '320 GSM // COMBED ORGANIC COTTON',
    href: '/shop?category=tees',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAwAUgBZhSXmEov54Hp_rXrKRyv5Q0AtETLVeBuwVkFhdfeSTYeKiuodxALlcC0e1aOwp2tPMhlpTbuL3RY12TIBssNXZtIcB7p9-yyfiU1nP1z2xVdWGQR2zkmj5gQNiPYo1UK0IBNXUqRFX5qpOouj4iEcotklnUrb7N0BIsQJeSlP6UmDr0WJRW9V6mW0PIX5vUqjFYi8XJ-3HHn5t90XV0VFb6qBpKOgqHIXfY',
  },
  {
    title: 'FLEECE & OUTERWEAR',
    subtitle: '520 GSM // BONDED ARCHIVAL LAYERS',
    href: '/shop?category=hoodies',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCcJRtNfzG_hIFPW-rc9HBEM5zepJCxzTc6JKL6plPX0nDB5wMwn0lttVzXKooNPzEnbsMU30gTFx1QoTTH3P1dlWR3bZcM5ayBGGMlBeloh7v9nSa0SugiYExnlkJrAME-Cy-PF1GxtFVUUbZoqAuO-_e1eR_qDcADrJy5pQsu_PYil-toMERicl3nFGtjUartj0MpBOJ0gjs9ILCtWlfsfsLHkm9P1s42f0VOdo8',
  },
  {
    title: 'BOTTOMS & CARGOS',
    subtitle: '380 GSM // ARTICULATED RIPSTOP',
    href: '/shop?category=cargo',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpxE5SKOV9MxVRhwbhsMr1kUl4YnvCfpow996U6Z2e9ee2zDuwW_L8JYOv_rcW12TFj2inUjGVE_8mYsYzo1sIkY0YCMADaaQaPmhd9Xqh01Zq5tfVj-5lXkcjdKFDpzH_qOg7EryJxJ4e1_J7QvM6BQk9xewDMsMhn1GTI1S-f895FzlQEGRRw5J3X9dwoGukzRyaBxZmrX7OZj-oiZWhxrvP82IPROnkmWYZeRo',
  },
];

const MOSAIC_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBB0bQYGArQHOWVAyhFDQHjXClEbvdejAYlPaCn7WBh_-AIQVJWidgYxuUm-o6FDeDCCVpuvbk1NftI96m9dWpSZPkXiUHtZ1XDpfz-qOii2ylF4HJPWvF7-zhyYW_zz2xCiHV-qrutq1gtlW-2OsVHakhXdoTd1daYk0XxQ-EDKRVE4a5KHCSFO59g2YFPgypSsaQYT8hG8-r6UjwMYrACisRMt7RQoY18-hE_odA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDwkfJ79oQve1_-k77KaF-PjuYVe3L6rv67ywSYS1i1bR8KPdhmcjpvbWefaQK-k7-MGNDxrFnKQ-5971tJkSYuFCbJHdXuNEwNvqtYZIhqMzq_VzHnNPSS1nicDbvUhmlI4yO9SfjcMoaenFmqIfKbvLWpvwBpch2uSY6PXBfk_r9uxGeE4pQlEv0G-KpWDG3KaRQBqQGl5fA6ksGVEb43kX95aXxP1oVgG1rJHjE',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBmp0zoBtMJ0cF7liJzFr7ds9JkRtoDanerISTic2q-zhFV1fhDnW8Fhipa3fRv-GZQ2rv3nYhUTdbO4Wvpy-rNylcoN11WObEmWd9O5OVaPU3o9RANdoNP-ja8AcKoIDOHkujXMA3M5nmLSdwIuK3PXo_pfcnZuz0CnhyQjpxc8rKkaUpFxi66GsNTeHzvNENWksqaYiYBKvVvQB1OAwVZ6s3bvRfaWG61C0IVxY4',
];

const IN_THE_WILD = [
  {
    city: 'TOKYO // SHIBUYA',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBWScRil7C0hkD2NrD_du5mVuuYyS9f-FiIITMRBsp7FKaTchUiw7xlQgNOqO-Xclw-Z4kIQ4G6ebBT4rjGl0VKRN5JJjwhN_iiuzmyAg8N1py-LHWs_LXkqh91rqdQmMO1k3O065Ze1xaO0lEQhwPsJI2_9CGPBvV2b-E2FGBh6JM3NxiBpRI4M8cvfW1VKTvVk-9-7qjDanf-7__bo3LUS5N4rS9R3T7pwFkYCLw',
  },
  {
    city: 'LONDON // BARBICAN',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAjdWuoLi9YanaDk-z9_SSt19KNMP5S5dzftg-SLPsWx7W4ztXyuydkfZGdPMFcHM3FpSlyePFTB8-PDWW7YcdFD9ZRol_Mgvx3hltFoSydTKLj_4j0gAejDqmr82J3gjk2QioF9XPOnjlx7o0TsFXYAwGsmuxeyiI4kfOo5RfvkP5ebgW5qXpQ2J9g1PnY_0ys_pYWPcX4x9yNXshS_LsA-sOaP9zu1Og-leDGRlc',
  },
  {
    city: 'COLOMBO // FLAGSHIP',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBGDah1JzqmvT29vOGIpIpc950Dwcu8iTA16UfdWlCTC5YJa09dpMGx0-y8G-yv9KUteTLG-7RQzSkphrAjO0WwqXoT85tfC_q-EZ8WSrLlChYEBDL0L5PMUNiDIgdYuWx4I15xCNptxZTfjIDj8L1TMWbmIKw7fNOPkl1JhPdRPi8BTyVH6r6ex8zSaSaBsKntrhBgYo-s7moCzfyYS07azMNvmPHAAi8xuDSWAqo',
  },
  {
    city: 'NEW YORK // SOHO',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAeGlg-mRG0fEC0cR237FQgwHFMoIn4N_-FuWbSrWvmPJQO42oSLG267RhrinOPYLkYJLXR6-xAi6j0ETnMhRANmoI9aFFlfR1cYlMdqy6FY7tBqUa-Dnl6UKlexN7xN3_qDcgqvF78IYnxP45yF917uY_GyCiptTYrJzOje3nFazkt0b-pRvdSR4zRufELbAgHL_-sY9x53aZwunE7VS-34MxNWSrDZPuD2v6VxIU',
  },
  {
    city: 'PARIS // LE MARAIS',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDdz_94K_yoh6RXVLLCdETgS5jMeoJ6UZ6cek4TLWQlexaUfxe8Swbr6vqTfiN--hvfzIx3t6JThvyFkz3Pu03ndvhX6JQI8RIywKF7j449vlom9DA0GYFBLAqQhmTeq2s0XemK7va9eGNoTG_g69sDAuHY61rKRYb4qWo5u5CbJoWkAfGWUQ5jGTNMcU1EE6GhkaleIzPERC_xsiVu3x0rShljX5vPpo95xQFLS9Y',
  },
];

export default function HomePage() {
  const { announce } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [releaseTab, setReleaseTab] = useState<'ALL' | 'BESTSELLERS' | 'NEW'>(
    'ALL',
  );
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ items: Product[] }>('/products')
      .then((res) => setProducts(res.items))
      .catch(() => {});
  }, []);

  const displayedReleases = products
    .filter((p) => {
      if (releaseTab === 'BESTSELLERS') return p.isBestseller;
      if (releaseTab === 'NEW') return p.isNewDrop;
      return true;
    })
    .slice(0, 4);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = waitlistEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setWaitlistStatus('ENTER A VALID EMAIL FOR ARCHIVE 02 ACCESS.');
      return;
    }
    try {
      await apiFetch('/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email, source: 'HOME_HERO_WAITLIST' }),
      });
      setWaitlistStatus('CONFIRMED // 24H EARLY DROP KEY REGISTERED.');
      setWaitlistEmail('');
      announce('ADDED TO UNRELEASED DROP WAITLIST');
    } catch (err: unknown) {
      setWaitlistStatus(getErrorMessage(err, 'UNABLE TO SUBSCRIBE'));
    }
  };

  return (
    <StorefrontShell>
      {/* SECTION 1: Hero Editorial Canvas */}
      <section className="relative w-full min-h-[88vh] pt-26 flex items-end bg-surface-container-lowest overflow-hidden">
        <img
          alt="VERSSARO Drop 01 Campaign Hero"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-75"
          src={HERO_IMG}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-surface via-surface/35 to-surface/65"
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-margin-mobile md:px-margin pb-16 pt-28 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 self-start bg-surface/85 backdrop-blur-md px-3 py-1 font-data-mono text-[11px] uppercase tracking-[0.2em] text-primary-fixed">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
            <span>ARCHIVE 01 // COLOMBO FLAGSHIP RELEASE</span>
          </div>

          <h1 className="font-display-xl text-display-xl-mobile md:text-display-xl uppercase text-on-surface max-w-4xl">
            DEFINE YOUR PRESENCE.
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
            Engineered in architectural heavyweight jerseys and bonded membranes.
            Limited small-batch capsules anchored by embedded HF NFC provenance.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              className="bg-on-surface text-surface hover:bg-primary-fixed px-8 py-4 font-label-caps-lg text-label-caps-lg uppercase tracking-widest font-bold transition-colors"
              href="/shop"
            >
              EXPLORE ARCHIVE 01
            </Link>
            <Link
              className="bg-surface/80 backdrop-blur-md hover:bg-surface-container-highest text-on-surface px-8 py-4 font-label-caps-lg text-label-caps-lg uppercase tracking-widest transition-colors"
              href="/vault"
            >
              NFC PROVENANCE VAULT
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE FOUNDATIONS */}
      <section className="w-full py-20 px-margin-mobile md:px-margin bg-surface">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-data-mono text-data-mono text-outline uppercase tracking-widest">
                01 // ARCHITECTURAL PILLARS
              </span>
              <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface mt-1">
                THE FOUNDATIONS
              </h2>
            </div>
            <Link
              className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-on-surface-variant hover:text-on-surface flex items-center gap-1.5"
              href="/shop"
            >
              <span>VIEW FULL INDEX</span>
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {FOUNDATIONS.map((f) => (
              <Link
                className="group relative aspect-[3/4] bg-surface-container-low overflow-hidden flex items-end"
                href={f.href}
                key={f.title}
              >
                <img
                  alt={f.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  src={f.image}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/20 to-transparent"
                />
                <div className="relative z-10 p-6 w-full space-y-1">
                  <span className="font-data-mono text-[10px] text-outline uppercase tracking-widest">
                    {f.subtitle}
                  </span>
                  <h3 className="font-headline-sm text-headline-sm uppercase text-on-surface">
                    {f.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: SIGNATURE RELEASES */}
      <section className="w-full py-20 px-margin-mobile md:px-margin bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="font-data-mono text-data-mono text-outline uppercase tracking-widest">
                02 // CURATED CAPSULE ALLOCATION
              </span>
              <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface mt-1">
                SIGNATURE RELEASES
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'BESTSELLERS', 'NEW'] as const).map((tab) => (
                <button
                  className={`px-4 py-2 font-label-caps-sm text-[11px] uppercase tracking-widest transition-colors ${
                    releaseTab === tab
                      ? 'bg-on-surface text-surface font-bold'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  }`}
                  key={tab}
                  onClick={() => setReleaseTab(tab)}
                  type="button"
                >
                  {tab === 'ALL'
                    ? 'ALL SILHOUETTES'
                    : tab === 'BESTSELLERS'
                      ? 'BESTSELLERS'
                      : 'NEW DROPS'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {displayedReleases.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="pt-4 flex justify-center">
            <Link
              className="bg-surface-container-high hover:bg-on-surface text-on-surface hover:text-surface px-10 py-4 font-label-caps-lg text-label-caps-lg uppercase tracking-widest transition-colors"
              href="/shop"
            >
              SHOP COMPLETE ARCHIVE ({products.length} PIECES)
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4: PHILOSOPHY OF ARCHITECTURE */}
      <section className="w-full py-24 px-margin-mobile md:px-margin bg-surface">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="font-data-mono text-data-mono text-crimson uppercase tracking-[0.2em]">
              03 // COLOMBO ATELIER MANIFESTO
            </span>
            <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface leading-tight">
              PHILOSOPHY OF ARCHITECTURE
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Every VERSSARO silhouette begins on drafting tables in Colombo. We
              mill ultra-dense 320 GSM jersey and 520 GSM loopback French terry
              exclusively for structural drape, embedding passive NFC silicon tags
              into seams to immortalize garment provenance.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="bg-surface-container-low p-4">
                <div className="font-headline-md text-headline-md text-on-surface">
                  520
                </div>
                <div className="font-data-mono text-[10px] text-outline uppercase">
                  PEAK GSM DENSITY
                </div>
              </div>
              <div className="bg-surface-container-low p-4">
                <div className="font-headline-md text-headline-md text-on-surface">
                  100%
                </div>
                <div className="font-data-mono text-[10px] text-outline uppercase">
                  NFC ATTESTED
                </div>
              </div>
              <div className="bg-surface-container-low p-4">
                <div className="font-headline-md text-headline-md text-on-surface">
                  24H
                </div>
                <div className="font-data-mono text-[10px] text-outline uppercase">
                  GLOBAL DISPATCH
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                className="inline-flex items-center gap-2 font-label-caps-lg text-label-caps-lg uppercase text-on-surface hover:text-primary tracking-widest"
                href="/editorial"
              >
                <span>READ EDITORIAL JOURNAL</span>
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 gap-gutter">
            <div className="aspect-[4/5] bg-surface-container-low overflow-hidden">
              <img
                alt="500 GSM Loopback Terry macro texture"
                className="w-full h-full object-cover"
                src={MOSAIC_IMAGES[0]}
              />
            </div>
            <div className="grid grid-rows-2 gap-gutter">
              <div className="bg-surface-container-low overflow-hidden">
                <img
                  alt="Atelier pattern cutter inspection"
                  className="w-full h-full object-cover"
                  src={MOSAIC_IMAGES[1]}
                />
              </div>
              <div className="bg-surface-container-low overflow-hidden">
                <img
                  alt="Colombo cutting table architecture"
                  className="w-full h-full object-cover"
                  src={MOSAIC_IMAGES[2]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: IN THE WILD // @VERSSARO */}
      <section className="w-full py-20 px-margin-mobile md:px-margin bg-surface-container-low">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="font-data-mono text-data-mono text-outline uppercase tracking-widest">
                04 // GLOBAL COLLECTOR ARCHIVE
              </span>
              <h2 className="font-headline-md text-headline-md uppercase text-on-surface mt-1">
                IN THE WILD // @VERSSARO
              </h2>
            </div>
            <span className="font-data-mono text-[11px] text-on-surface-variant uppercase">
              TOKYO · LONDON · COLOMBO · NYC · PARIS
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-gutter">
            {IN_THE_WILD.map((tile) => (
              <div
                className="group relative aspect-square bg-surface-container overflow-hidden"
                key={tile.city}
              >
                <img
                  alt={tile.city}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  src={tile.image}
                />
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-surface/85 backdrop-blur-sm">
                  <span className="font-data-mono text-[10px] text-on-surface uppercase tracking-widest">
                    {tile.city}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: ACCESS THE UNRELEASED */}
      <section className="w-full py-24 px-margin-mobile md:px-margin bg-surface">
        <div className="max-w-3xl mx-auto bg-surface-container-low p-8 md:p-12 text-center space-y-6">
          <span className="font-data-mono text-[11px] text-gold uppercase tracking-[0.2em]">
            PRIVATE DROP REGISTRY // TIER 02 WHITELIST
          </span>
          <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface">
            ACCESS THE UNRELEASED
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mx-auto">
            Register your email for private access codes 24 hours prior to Archive
            02 Cybernetic Drape public allocation.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            noValidate
            onSubmit={(e) => void handleWaitlist(e)}
          >
            <label className="visually-hidden" htmlFor="home-waitlist-email">
              Email address for Archive 02 private drop access
            </label>
            <input
              autoComplete="email"
              className="flex-1 bg-surface-container-lowest px-4 py-3.5 font-data-mono text-data-mono text-on-surface placeholder:text-outline focus:outline-none uppercase"
              id="home-waitlist-email"
              onChange={(e) => setWaitlistEmail(e.target.value)}
              placeholder="ENTER YOUR EMAIL"
              type="email"
              value={waitlistEmail}
            />
            <button
              className="bg-on-surface text-surface hover:bg-primary-fixed px-8 py-3.5 font-label-caps-lg text-label-caps-lg uppercase font-bold transition-colors"
              type="submit"
            >
              REQUEST KEY
            </button>
          </form>
          {waitlistStatus ? (
            <p
              aria-live="polite"
              className="font-data-mono text-[11px] text-primary-fixed uppercase"
            >
              {waitlistStatus}
            </p>
          ) : null}
        </div>
      </section>
    </StorefrontShell>
  );
}
