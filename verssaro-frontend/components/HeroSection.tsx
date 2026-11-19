'use client';

import React, { useEffect, useRef, useState } from 'react';
import { HalftoneCanvas } from './HalftoneCanvas';

const HERO_PANELS = [
  {
    id: 'guardian',
    name: 'Guardian of the Flame',
    img: '/assets/img/guardian-pair.webp',
    alt: 'Two models in black VERSSARO oversized tees showing the Guardian of the Flame print',
  },
  {
    id: 'mayara',
    name: 'Mayara',
    img: '/assets/img/mayara-full.webp',
    alt: 'Woman seated in a black VERSSARO tee showing the Mayara back print',
  },
  {
    id: 'ivory',
    name: 'The Hanging Edit',
    img: '/assets/img/hanging-trio.webp',
    alt: 'Three VERSSARO graphic tees hanging in front of an arched window over tea hills',
  },
];

export function HeroSection({
  onSelectProduct,
}: {
  onSelectProduct?: (productId: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [scatter, setScatter] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [timerProgress, setTimerProgress] = useState(0);
  const heroRef = useRef<HTMLElement | null>(null);

  // Auto-play progress bar and panel rotation
  useEffect(() => {
    if (isPaused) return;
    const duration = 6500;
    const start = performance.now();
    let rafId: number;

    const frame = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      setTimerProgress(progress);

      if (elapsed >= duration) {
        setActiveIndex((prev) => (prev + 1) % HERO_PANELS.length);
        setTimerProgress(0);
      } else {
        rafId = requestAnimationFrame(frame);
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [activeIndex, isPaused]);

  // Pointer tilt & scroll scatter
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / (rect.height * 0.75)));
      setScatter(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    setPointer({ x, y });
  };

  const getSlot = (k: number) => {
    const diff = (k - activeIndex + HERO_PANELS.length) % HERO_PANELS.length;
    if (diff === 0) return 'center';
    if (diff === 1) return 'right';
    return 'left';
  };

  return (
    <section
      ref={heroRef}
      className="hero"
      id="hero"
      onPointerMove={handlePointerMove}
      aria-label="VERSSARO Heritage Graphic Collection"
    >
      <div className="hero__sticky">
        <div
          className="hero__glow"
          style={{
            transform: `translate(${pointer.x * 60}px, ${pointer.y * 40}px)`,
          }}
          aria-hidden="true"
        />

        {/* 3-Panel Campaign Stage */}
        <div
          className="hero__stage"
          id="heroStage"
          onPointerEnter={() => setIsPaused(true)}
          onPointerLeave={() => setIsPaused(false)}
          style={
            {
              '--mx': pointer.x.toFixed(3),
              '--my': pointer.y.toFixed(3),
            } as React.CSSProperties
          }
        >
          {HERO_PANELS.map((p, idx) => {
            const slot = getSlot(idx);
            return (
              <figure
                key={p.id}
                className="hero__panel cursor-pointer"
                data-slot={slot}
                data-cursor="View"
                onClick={() => {
                  if (slot !== 'center') {
                    setActiveIndex(idx);
                  } else {
                    onSelectProduct?.(p.id);
                  }
                }}
              >
                <img src={p.img} alt={p.alt} width={1122} height={1152} />
              </figure>
            );
          })}
        </div>

        <div className="hero__shade" aria-hidden="true" />

        {/* Interactive Halftone Canvas Dots */}
        <div className="hero__dots" id="heroDots">
          <HalftoneCanvas
            options={{
              text: 'HERITAGE',
              font: '800 100px Montserrat, Arial, sans-serif',
              crop: 0.18,
              fill: 0.98,
              dotGap: 6,
              radius: 95,
              ink: '#D9B25C',
              warm: '#FFF2CC',
            }}
            scatter={scatter}
            className="w-full h-full"
          />
        </div>

        <h1 className="sr">VERSSARO — Sri Lankan heritage, modern expression</h1>

        {/* Top Copy & CTAs */}
        <div className="hero__top">
          <p className="eyebrow">
            <span className="eyebrow__line" />
            Heritage Graphic Collection
          </p>
          <p className="hero__lede">
            Island legends, guardians and dancers — redrawn for the way you move now.
          </p>
          <div className="hero__ctas">
            <a href="#collection" className="btn btn--gold" data-magnetic>
              <span>Explore the collection</span>
              <svg viewBox="0 0 24 24" className="w-4 h-4 ml-2 fill-none stroke-current stroke-2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a href="#studio" className="btn btn--ghost" data-magnetic>
              <span>Enter the studio</span>
            </a>
          </div>
        </div>

        {/* Slide Index */}
        <div className="hero__index" id="heroIndex">
          <span className="hero__num">
            <b>{String(activeIndex + 1).padStart(2, '0')}</b> / 03
          </span>
          <ul>
            {HERO_PANELS.map((p, idx) => (
              <li
                key={p.id}
                className={idx === activeIndex ? 'is-active' : ''}
                onClick={() => setActiveIndex(idx)}
              >
                {p.name}
              </li>
            ))}
          </ul>
          <span className="hero__bar">
            <i
              id="heroBar"
              style={{
                transform: `scaleX(${timerProgress.toFixed(3)})`,
                transformOrigin: 'left',
              }}
            />
          </span>
        </div>

        <a className="hero__scroll" href="#manifesto" aria-label="Scroll to explore">
          <span>Scroll</span>
          <i />
        </a>
      </div>
    </section>
  );
}
