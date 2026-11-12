import React from 'react';

export function VerssaroMark({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        height="29"
        stroke="currentColor"
        strokeWidth="1.75"
        width="29"
        x="1.5"
        y="1.5"
      />
      <path
        d="M8.5 9L16 23L23.5 9"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="2.25"
      />
      <path d="M12.5 9H19.5" stroke="#B22222" strokeWidth="2" />
    </svg>
  );
}

