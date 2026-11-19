'use client';

import React from 'react';

export const ARM_PATH =
  'M 0,-106 L -36,-72 L -11,-35 L 5,-39 L 6,-20 C 6,-10 3,-4 0,0 C 11,-9 17,-25 17,-52 C 16,-54 14,-55 13,-54 L -5,-48 L -9,-51 L -20,-71 L -1,-90 L 14,-74 L 6,-61 L 31,-73 L 31,-76 Z';

export function VerssaroEmblem({
  className = 'w-12 h-12',
  color = 'currentColor',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="-130 -130 260 260"
      className={className}
      fill={color}
      aria-hidden="true"
    >
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <path
          key={deg}
          d={ARM_PATH}
          transform={`rotate(${deg})`}
          className="transition-transform duration-700"
        />
      ))}
    </svg>
  );
}

export function VerssaroLogo({
  className = 'h-7',
  color = '#d9b25c',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/assets/brand/Verssaro_Horizontal_Heritage_Gold.svg"
        alt="VERSSARO"
        className="h-full w-auto object-contain"
      />
    </div>
  );
}
