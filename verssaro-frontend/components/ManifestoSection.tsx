'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ARM_PATH } from './VerssaroLogo';

const MANIFESTO_TEXT =
  'VERSSARO reimagines timeless island legends, guardians and cultural icons through contemporary design. Six hooked arms, one turning centre: our emblem is a pinwheel of protection — heritage in motion, worn with intent.';

export function ManifestoSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const words = MANIFESTO_TEXT.split(' ');

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = sectionRef.current.offsetHeight - vh;
      if (total <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / total));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const litCount = Math.floor(scrollProgress * words.length * 1.3);

  return (
    <section ref={sectionRef} className="manifesto" id="manifesto">
      <div className="manifesto__sticky">
        {/* Animated Expanding 6-Arm Emblem */}
        <div className="manifesto__emblem" aria-hidden="true">
          <svg
            viewBox="-160 -160 320 320"
            className="w-full h-full text-[#d9b25c]"
            fill="currentColor"
            style={{
              transform: `rotate(${Number((scrollProgress * 140).toFixed(2))}deg)`,
              transition: 'transform 0.1s ease-out',
            }}
          >
            {[0, 60, 120, 180, 240, 300].map((deg) => {
              const th = (deg * Math.PI) / 180;
              const off = (1 - scrollProgress) * 50;
              const scale = 0.5 + 0.5 * scrollProgress;
              const tx = Number((Math.sin(th) * off).toFixed(2));
              const ty = Number((-Math.cos(th) * off).toFixed(2));
              const sc = Number(scale.toFixed(2));
              const op = Number((0.2 + 0.8 * scrollProgress).toFixed(2));
              return (
                <path
                  key={deg}
                  d={ARM_PATH}
                  transform={`translate(${tx} ${ty}) rotate(${deg}) scale(${sc})`}
                  style={{ opacity: op }}
                />
              );
            })}
          </svg>
          <span className="manifesto__ring" />
        </div>

        {/* Brand Manifesto & Stats */}
        <div className="manifesto__copy">
          <p className="eyebrow">
            <span className="eyebrow__line" />
            The house
          </p>
          <p className="manifesto__text" id="manifestoText">
            {words.map((word, i) => (
              <span
                key={i}
                className={`transition-colors duration-300 inline-block mr-2 ${
                  i < litCount ? 'text-[#f3ecde]' : 'text-[#f3ecde]/20'
                }`}
              >
                {word}
              </span>
            ))}
          </p>

          <div className="stats">
            <div>
              <b className="font-['Montserrat'] font-extrabold text-[#d9b25c]">
                6
              </b>
              <span>Arms of the emblem</span>
            </div>
            <div>
              <b className="font-['Montserrat'] font-extrabold text-[#d9b25c]">
                4
              </b>
              <span>Graphic stories</span>
            </div>
            <div>
              <b className="font-['Montserrat'] font-extrabold text-[#d9b25c]">
                100%
              </b>
              <span>Sri Lankan rooted</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
