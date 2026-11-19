'use client';

import React, { useEffect, useRef } from 'react';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLSpanElement | null>(null);
  const ringRef = useRef<HTMLSpanElement | null>(null);
  const labelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Only enable on fine pointer devices without reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (prefersReduced || isTouch) return;

    const cur = cursorRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!cur || !dot || !ring || !label) return;

    let mx = -100;
    let my = -100;
    let rx = -100;
    let ry = -100;
    let rafId: number;

    const onPointerMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      cur.classList.add('is-on');
    };

    const onPointerLeave = () => {
      cur.classList.remove('is-on');
    };

    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);

    const onPointerOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest('[data-cursor], a, button, input, [role="radio"], [role="tab"]');
      cur.classList.toggle('is-hover', !!interactive);

      const cursorTarget = target.closest('[data-cursor]') as HTMLElement | null;
      const cursorText = cursorTarget?.dataset.cursor || '';
      cur.classList.toggle('has-label', !!cursorText);
      label.textContent = cursorText;
    };

    document.addEventListener('mouseover', onPointerOver);

    // Magnetic buttons
    const handleMagneticMove = (el: HTMLElement) => (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    };

    const handleMagneticLeave = (el: HTMLElement) => () => {
      el.style.transform = '';
    };

    const magneticElements = document.querySelectorAll<HTMLElement>('[data-magnetic]');
    const cleanups: Array<() => void> = [];

    magneticElements.forEach((el) => {
      const moveHandler = handleMagneticMove(el);
      const leaveHandler = handleMagneticLeave(el);
      el.addEventListener('pointermove', moveHandler as any);
      el.addEventListener('pointerleave', leaveHandler);
      cleanups.push(() => {
        el.removeEventListener('pointermove', moveHandler as any);
        el.removeEventListener('pointerleave', leaveHandler);
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('mouseover', onPointerOver);
      cleanups.forEach((c) => c());
    };
  }, []);

  return (
    <div ref={cursorRef} className="cursor" aria-hidden="true">
      <span ref={dotRef} className="cursor__dot" />
      <span ref={ringRef} className="cursor__ring">
        <em ref={labelRef} className="cursor__label" />
      </span>
    </div>
  );
}
