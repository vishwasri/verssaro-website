'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Product } from '@/lib/types';
import { HalftoneCanvas } from './HalftoneCanvas';

interface ClothStudioProps {
  products: Product[];
  activeDesignIndex?: number;
  onOpenQuickView: (product: Product) => void;
  onAddToBag: (product: Product, size: string) => void;
}

export function ClothStudio({
  products,
  activeDesignIndex = 0,
  onOpenQuickView,
  onAddToBag,
}: ClothStudioProps) {
  const [designIndex, setDesignIndex] = useState(activeDesignIndex);
  const [breeze, setBreeze] = useState(45);
  const [light, setLight] = useState(55);
  const [isPaused, setIsPaused] = useState(false);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const clothInstanceRef = useRef<any>(null);

  useEffect(() => {
    setDesignIndex(activeDesignIndex);
  }, [activeDesignIndex]);

  const current = products[designIndex] || products[0];

  useEffect(() => {
    // Load textures.js and cloth.js dynamically if not already on window
    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          return resolve();
        }
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject();
        document.body.appendChild(s);
      });

    let active = true;

    async function init() {
      try {
        await loadScript('/assets/js/core.js');
        await loadScript('/assets/js/textures.js');
        await loadScript('/assets/js/cloth.js');

        if (!active || !canvasRef.current) return;
        const ClothClass = (window as any).Cloth;
        const VS_TEX = (window as any).VS_TEX;

        if (ClothClass && canvasRef.current) {
          try {
            const instance = ClothClass(canvasRef.current, {
              onInteract: () => {
                const hint = document.getElementById('clothHint');
                if (hint) hint.classList.add('is-gone');
              },
            });
            if (instance) {
              clothInstanceRef.current = instance;
              instance.wind = breeze / 100;
              instance.light = light / 100;

              const texKeys = ['guardian', 'mayara', 'ivory', 'highlands'];
              const key = texKeys[designIndex] || 'guardian';
              if (VS_TEX && VS_TEX[key]) {
                instance.setTexture(VS_TEX[key]);
              }
            } else {
              setWebGlSupported(false);
            }
          } catch (err) {
            console.warn('WebGL Cloth simulation error:', err);
            setWebGlSupported(false);
          }
        }
      } catch {
        setWebGlSupported(false);
      }
    }

    init();

    return () => {
      active = false;
    };
  }, []);

  // Update texture when design index changes
  useEffect(() => {
    if (clothInstanceRef.current && (window as any).VS_TEX) {
      const texKeys = ['guardian', 'mayara', 'ivory', 'highlands'];
      const key = texKeys[designIndex] || 'guardian';
      const tex = (window as any).VS_TEX[key];
      if (tex) {
        clothInstanceRef.current.setTexture(tex);
      }
    }
  }, [designIndex]);

  const handleWindChange = (val: number) => {
    setBreeze(val);
    if (clothInstanceRef.current) {
      clothInstanceRef.current.wind = val / 100;
    }
  };

  const handleLightChange = (val: number) => {
    setLight(val);
    if (clothInstanceRef.current) {
      clothInstanceRef.current.light = val / 100;
    }
  };

  const handleTogglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    if (clothInstanceRef.current) {
      clothInstanceRef.current.pause(next);
    }
  };

  const handleReset = () => {
    if (clothInstanceRef.current) {
      clothInstanceRef.current.reset();
    }
  };

  return (
    <section
      className="studio section"
      id="studio"
      aria-label="Interactive garment studio"
    >
      <div className="studio__head">
        <p className="eyebrow">
          <span className="eyebrow__line" />
          03 — The studio
        </p>
        <div className="h-16 md:h-24 w-full max-w-xl mx-auto mb-4">
          <HalftoneCanvas
            options={{
              text: 'STUDIO',
              font: '800 100px Montserrat, Arial, sans-serif',
              align: 'center',
              fill: 1.0,
              dotGap: 5,
              radius: 60,
              ink: '#D9B25C',
              warm: '#FFF2CC',
            }}
            className="w-full h-full"
          />
        </div>
        <h2 className="sr">The Studio</h2>
        <p className="studio__copy">
          A live cloth simulation of each garment. Drag the fabric, tap to send a
          ripple through it, raise the breeze — then switch designs.
        </p>
      </div>

      <div className="studio__body">
        <div className="studio__stage" id="clothStage" data-cursor="Drag">
          <canvas
            ref={canvasRef}
            id="cloth"
            className={`w-full h-full ${!webGlSupported ? 'hidden' : 'block'}`}
            aria-label="Interactive 3D T-shirt"
            role="img"
          />
          {!webGlSupported && (
            <img
              className="studio__fallback w-full h-full object-contain"
              src={current?.images?.[0] || '/assets/img/p-guardian.webp'}
              alt={`${current?.name || 'Garment'} tee on a hanger`}
            />
          )}
          <span className="studio__hint" id="clothHint">
            Drag to pull · Tap to ripple
          </span>
        </div>

        <aside className="studio__panel">
          <p className="studio__label">Design</p>
          <div
            className="swatches"
            id="swatches"
            role="radiogroup"
            aria-label="Choose a design"
          >
            {products.map((p, i) => (
              <button
                key={p.id || i}
                type="button"
                role="radio"
                aria-checked={i === designIndex}
                className={i === designIndex ? 'is-active' : ''}
                onClick={() => setDesignIndex(i)}
                aria-label={p.name}
              >
                <img
                  src={p.images?.[0] || '/assets/img/p-guardian.webp'}
                  alt={p.name}
                />
                <span>{p.name}</span>
              </button>
            ))}
          </div>

          <h3 className="studio__name" id="studioName">
            {current?.name}
          </h3>
          <p className="studio__meta" id="studioMeta">
            {current?.editionLabel} · {current?.categoryLabel}
          </p>

          <label className="slider">
            <span>Breeze</span>
            <input
              type="range"
              id="wind"
              min="0"
              max="100"
              value={breeze}
              onChange={(e) => handleWindChange(Number(e.target.value))}
              aria-label="Breeze strength"
            />
            <output>{breeze}</output>
          </label>

          <label className="slider">
            <span>Light</span>
            <input
              type="range"
              id="light"
              min="0"
              max="100"
              value={light}
              onChange={(e) => handleLightChange(Number(e.target.value))}
              aria-label="Light angle"
            />
            <output>{light}</output>
          </label>

          <div className="studio__btns">
            <button
              type="button"
              className="chip"
              onClick={handleTogglePause}
              aria-pressed={isPaused}
            >
              {isPaused ? 'Play' : 'Pause'}
            </button>
            <button type="button" className="chip" onClick={handleReset}>
              Reset
            </button>
            <button
              type="button"
              className="chip chip--gold"
              onClick={() => onOpenQuickView(current)}
            >
              Add to enquiry
            </button>
          </div>

          <p className="studio__note">
            Simulated fabric for exploring the artwork. See the product photos
            for exact garment detail.
          </p>
        </aside>
      </div>
    </section>
  );
}
