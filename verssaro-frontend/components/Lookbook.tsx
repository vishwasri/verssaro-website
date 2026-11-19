'use client';

import React, { useEffect, useRef, useState } from 'react';

const LOOKS = [
  {
    num: '01',
    title: 'Highlands at dusk',
    sub: 'Mayara · Guardian of the Flame',
    img: '/assets/img/highlands.webp',
    alt: 'Couple in brown VERSSARO tees watching sunset over tea hills',
    aspect: 'normal',
  },
  {
    num: '02',
    title: 'Mayara',
    sub: 'The peacock dancer',
    img: '/assets/img/mayara-full.webp',
    alt: 'Mayara back print worn in a sunlit courtyard',
    aspect: 'tall',
  },
  {
    num: '03',
    title: 'The Guardian, in pairs',
    sub: 'Front emblem · back story',
    img: '/assets/img/guardian-pair.webp',
    alt: 'Guardian of the Flame worn as a pair',
    aspect: 'normal',
  },
  {
    num: '04',
    title: 'The Hanging Edit',
    sub: 'Black · Black · Ivory',
    img: '/assets/img/hanging-trio.webp',
    alt: 'Three tees hanging under an arch',
    aspect: 'wide',
  },
  {
    num: '05',
    title: 'Ivory, unboxed',
    sub: 'Guardian on ivory',
    img: '/assets/img/box-ivory.webp',
    alt: 'Ivory Guardian tee unboxed with emblem tissue',
    aspect: 'normal',
  },
];

export function Lookbook() {
  const lookRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!lookRef.current || !trackRef.current) return;
      const rect = lookRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = lookRef.current.offsetHeight - vh;
      if (total <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / total));
      setScrollProgress(progress);

      if (window.innerWidth > 820) {
        const dist = trackRef.current.scrollWidth - window.innerWidth;
        trackRef.current.style.transform = `translate3d(${-progress * dist}px, 0, 0)`;
      } else {
        trackRef.current.style.transform = 'none';
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const currentIndex = Math.min(
    LOOKS.length,
    1 + Math.floor(scrollProgress * LOOKS.length * 0.99),
  );

  return (
    <section ref={lookRef} className="look" id="lookbook" aria-label="Lookbook">
      <div className="look__sticky">
        <div className="look__intro">
          <p className="eyebrow">
            <span className="eyebrow__line" />
            04 — Lookbook
          </p>
          <h2 className="title">
            <span className="thin">The island</span> <b>in motion</b>
          </h2>
          <p className="look__count">
            <b id="lookNum">{String(currentIndex).padStart(2, '0')}</b> / 05
          </p>
        </div>

        <div ref={trackRef} className="look__track" id="lookTrack">
          {LOOKS.map((it) => (
            <figure
              key={it.num}
              className={`look__item ${it.aspect === 'tall' ? 'look__item--tall' : ''} ${it.aspect === 'wide' ? 'look__item--wide' : ''}`}
            >
              <div className="look__img">
                <img src={it.img} alt={it.alt} loading="lazy" />
              </div>
              <figcaption>
                <i>{it.num}</i>
                {it.title}
                <span>{it.sub}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="look__bar">
          <i
            id="lookBar"
            style={{ transform: `scaleX(${scrollProgress})` }}
          />
        </div>
      </div>
    </section>
  );
}
