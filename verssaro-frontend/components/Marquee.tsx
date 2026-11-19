'use client';

import React, { useEffect, useRef } from 'react';
import { ARM_PATH } from './VerssaroLogo';

export function Marquee() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let lastY = window.scrollY;
    let vel = 0;
    let pos = 0;
    let raf = 0;

    const onScroll = () => {
      const sy = window.scrollY;
      vel = sy - lastY;
      lastY = sy;
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const loop = () => {
      vel *= 0.92;
      pos -= 0.8 + Math.abs(vel) * 0.2;
      if (trackRef.current) {
        const half = trackRef.current.scrollWidth / 2;
        if (-pos > half) pos += half;
        const skew = Math.min(8, Math.max(-8, -vel * 0.15));
        trackRef.current.style.transform = `translate3d(${pos}px,0,0) skewX(${skew}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const items = ['Heritage', 'Apparel', 'Sri Lanka', 'Guardians', 'Legends'];

  return (
    <div className="marquee" aria-hidden="true">
      <div ref={trackRef} className="marquee__track" id="marquee">
        {[...items, ...items, ...items, ...items].map((word, i) => (
          <React.Fragment key={i}>
            <span>{word}</span>
            <svg
              className="mq-emb w-7 h-7 mx-4 text-[#d9b25c]"
              viewBox="-130 -130 260 260"
              fill="currentColor"
            >
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <path key={deg} d={ARM_PATH} transform={`rotate(${deg})`} />
              ))}
            </svg>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
