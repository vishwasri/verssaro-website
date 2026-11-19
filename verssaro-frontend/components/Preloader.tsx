'use client';

import React, { useEffect, useState } from 'react';
import { ARM_PATH } from './VerssaroLogo';

export function Preloader({ onReady }: { onReady?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 8) + 4;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsOpening(true);
          onReady?.();
          setTimeout(() => {
            setIsDone(true);
          }, 900);
        }, 300);
      }
      setProgress(current);
    }, 45);

    return () => clearInterval(interval);
  }, [onReady]);

  if (isDone) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] pointer-events-none flex flex-col justify-between transition-opacity duration-700 ${
        isOpening ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
      aria-hidden="true"
    >
      {/* Doors parting */}
      <div
        className={`absolute top-0 left-0 w-1/2 h-full bg-[#0a0a0a] border-r border-[#d9b25c]/20 transition-transform duration-1000 ease-[cubic-bezier(0.7,0,0.2,1)] ${
          isOpening ? '-translate-x-full' : 'translate-x-0'
        }`}
      />
      <div
        className={`absolute top-0 right-0 w-1/2 h-full bg-[#0a0a0a] border-l border-[#d9b25c]/20 transition-transform duration-1000 ease-[cubic-bezier(0.7,0,0.2,1)] ${
          isOpening ? 'translate-x-full' : 'translate-x-0'
        }`}
      />

      {/* Gold center seam */}
      <div
        className={`absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#d9b25c] -translate-x-1/2 transition-opacity duration-500 ${
          isOpening ? 'opacity-0' : 'opacity-60'
        }`}
      />

      {/* Center Stage Logo */}
      <div className="relative z-10 m-auto flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-24 h-24 mb-6">
          <svg
            viewBox="-130 -130 260 260"
            className="w-full h-full text-[#d9b25c] animate-[spin_12s_linear_infinite]"
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
        </div>

        <div className="tracking-[0.4em] font-extrabold uppercase text-xs text-[#d9b25c] mb-2 font-['Montserrat']">
          VERSSARO
        </div>
        <p className="text-[10px] tracking-[0.25em] uppercase text-[#f3ecde]/60 font-['Montserrat']">
          Sri Lankan Heritage · Modern Expression
        </p>
      </div>

      {/* Counter bottom */}
      <div className="relative z-10 p-8 flex items-center justify-between text-xs tracking-widest text-[#d9b25c] font-mono">
        <span className="text-[10px] tracking-[0.2em] text-[#f3ecde]/50 font-['Montserrat'] uppercase">
          Curating Collection
        </span>
        <span className="text-sm font-bold">
          {String(progress).padStart(3, '0')}
        </span>
      </div>
    </div>
  );
}
