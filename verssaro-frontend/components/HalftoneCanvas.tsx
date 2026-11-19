'use client';

import React, { useEffect, useRef } from 'react';
import { ARM_PATH } from './VerssaroLogo';

interface HalftoneOptions {
  mode?: 'text' | 'emblem';
  text?: string;
  font?: string;
  align?: 'bottom' | 'center';
  crop?: number;
  fill?: number;
  letterSpacing?: number;
  ink?: string;
  warm?: string;
  dotGap?: number;
  radius?: number;
  emblemScale?: number;
  emblemX?: number;
  interactive?: boolean;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return [217, 178, 92]; // #D9B25C default gold
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function radiusFor(c: number, gap: number) {
  const clamped = Math.max(0, Math.min(1, c));
  return Math.sqrt(clamped) * gap * 0.56;
}

export function HalftoneCanvas({
  options = {},
  className = '',
  scatter = 0,
}: {
  options?: HalftoneOptions;
  className?: string;
  scatter?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scatterRef = useRef(scatter);
  scatterRef.current = scatter;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const opt: Required<HalftoneOptions> = {
      mode: options.mode || 'text',
      text: options.text || 'HERITAGE',
      font: options.font || '800 100px Montserrat, Arial, sans-serif',
      align: options.align || 'bottom',
      crop: options.crop ?? 0.2,
      fill: options.fill ?? 1.0,
      letterSpacing: options.letterSpacing ?? 0,
      ink: options.ink || '#D9B25C',
      warm: options.warm || '#FFF0C2',
      dotGap: options.dotGap ?? 7,
      radius: options.radius ?? 90,
      emblemScale: options.emblemScale ?? 0.92,
      emblemX: options.emblemX ?? 0.5,
      interactive: options.interactive ?? true,
    };

    const ink = hexToRgb(opt.ink);
    const warm = hexToRgb(opt.warm);
    let px = -1e5,
      py = -1e5;
    let ring = { x: 0, y: 0, t: -1 };
    let raf = 0;
    let dots = new Float32Array(0);
    let numDots = 0;
    let w = 1,
      h = 1;
    let dpr = 1;

    function layout() {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      const mask = document.createElement('canvas');
      mask.width = w;
      mask.height = h;
      const m = mask.getContext('2d', { willReadFrequently: true });
      if (!m) return;
      m.fillStyle = '#000';

      if (opt.mode === 'text') {
        const base = opt.font.replace(/\d+px/, '100px');
        m.font = base;
        const mw = m.measureText(opt.text).width;
        let size = (w * opt.fill / mw) * 100;
        m.font = base.replace('100px', size + 'px');
        const box = m.measureText(opt.text);
        const cap = box.actualBoundingBoxAscent || size * 0.72;
        m.textBaseline = 'alphabetic';
        const x = (w - box.width) / 2;
        const y =
          opt.align === 'bottom'
            ? h + cap * Math.max(0, Math.min(0.6, opt.crop))
            : (h + cap) / 2;
        m.fillText(opt.text, x, y);
      } else {
        const s = (Math.min(w, h) / 212) * opt.emblemScale;
        m.save();
        m.translate(w * opt.emblemX, h / 2);
        m.scale(s, s);
        const p = new Path2D(ARM_PATH);
        for (let i = 0; i < 6; i++) {
          m.save();
          m.rotate((i * Math.PI) / 3);
          m.fill(p);
          m.restore();
        }
        m.restore();
      }

      const img = m.getImageData(0, 0, w, h).data;
      const gap = Math.max(3, opt.dotGap);
      const cols = Math.ceil(w / gap);
      const rows = Math.ceil(h / gap);
      const tmp: number[] = [];

      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          let sum = 0;
          for (let sy = 0; sy < 3; sy++) {
            for (let sx = 0; sx < 3; sx++) {
              const x = Math.min(
                w - 1,
                Math.floor(gx * gap + ((sx + 0.5) * gap) / 3),
              );
              const y = Math.min(
                h - 1,
                Math.floor(gy * gap + ((sy + 0.5) * gap) / 3),
              );
              sum += img[(y * w + x) * 4 + 3];
            }
          }
          const cov = sum / (9 * 255);
          if (cov < 0.06) continue;
          const hx = gx * gap + gap / 2;
          const hy = gy * gap + gap / 2;
          tmp.push(
            hx,
            hy,
            0,
            0,
            hx,
            hy,
            radiusFor(cov, gap),
            (Math.random() - 0.5) * 260,
            -(80 + Math.random() * 420),
            Math.random(),
          );
        }
      }
      dots = new Float32Array(tmp);
      numDots = tmp.length / 10;
    }

    const onPointerMove = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      px = e.clientX - b.left;
      py = e.clientY - b.top;
    };

    const onPointerLeave = () => {
      px = py = -1e5;
    };

    const onPointerDown = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      ring = {
        x: e.clientX - b.left,
        y: e.clientY - b.top,
        t: performance.now(),
      };
    };

    if (opt.interactive) {
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerleave', onPointerLeave);
      canvas.addEventListener('pointerdown', onPointerDown);
    }

    layout();
    const ro = new ResizeObserver(() => layout());
    ro.observe(canvas);

    let running = true;
    const loop = (now: number) => {
      if (!running || !ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const r = opt.radius;
      const age = ring.t < 0 ? 1e9 : now - ring.t;
      const ringR = age * 0.9;
      const sc = Math.min(1, Math.max(0, scatterRef.current));
      const se = sc * sc * (3 - 2 * sc);
      const inkStr = `rgb(${ink.join(',')})`;

      for (let i = 0; i < numDots; i++) {
        const j = i * 10;
        let x = dots[j],
          y = dots[j + 1],
          vx = dots[j + 2],
          vy = dots[j + 3];
        const hx = dots[j + 4],
          hy = dots[j + 5];

        if (age < 900) {
          const dx = hx - ring.x,
            dy = hy - ring.y,
            dd = Math.sqrt(dx * dx + dy * dy) + 0.001;
          const band = 1 - Math.min(1, Math.abs(dd - ringR) / 26);
          if (band > 0) {
            const f = band * 3.2 * (1 - age / 900);
            vx += (dx / dd) * f;
            vy += (dy / dd) * f;
          }
        }

        const dx = x - px,
          dy = y - py,
          d2 = dx * dx + dy * dy;
        if (r > 0 && d2 < r * r) {
          const dd = Math.sqrt(d2) + 0.001,
            f = (1 - dd / r) * 2.6;
          vx += (dx / dd) * f;
          vy += (dy / dd) * f;
        }

        vx = (vx + (hx - x) * 0.05) * 0.84;
        vy = (vy + (hy - y) * 0.05) * 0.84;
        x += vx;
        y += vy;
        dots[j] = x;
        dots[j + 1] = y;
        dots[j + 2] = vx;
        dots[j + 3] = vy;

        let rx = x,
          ry = y,
          rad = dots[j + 6],
          alpha = 1;
        if (se > 0) {
          const k = Math.min(1, Math.max(0, se * 1.4 - dots[j + 9] * 0.4));
          rx += dots[j + 7] * k;
          ry += dots[j + 8] * k;
          rad *= 1 - k * 0.6;
          alpha = 1 - k;
          if (alpha <= 0.01) continue;
        }

        const dist = Math.hypot(x - hx, y - hy);
        const kk = Math.min(1, dist / 28);
        ctx.globalAlpha = alpha;
        ctx.fillStyle =
          kk > 0.02
            ? `rgb(${Math.round(ink[0] + (warm[0] - ink[0]) * kk)},${Math.round(
                ink[1] + (warm[1] - ink[1]) * kk,
              )},${Math.round(ink[2] + (warm[2] - ink[2]) * kk)})`
            : inkStr;

        ctx.beginPath();
        ctx.arc(rx, ry, Math.max(0.5, rad), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (opt.interactive) {
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerleave', onPointerLeave);
        canvas.removeEventListener('pointerdown', onPointerDown);
      }
    };
  }, [options]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
