'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/types';

interface OrbitSelectorProps {
  products: Product[];
  onOpenQuickView: (product: Product) => void;
  onSelectStudio: (index: number) => void;
  onAddToBag: (product: Product, size: string) => void;
}

export function OrbitSelector({
  products,
  onOpenQuickView,
  onSelectStudio,
  onAddToBag,
}: OrbitSelectorProps) {
  const [index, setIndex] = useState(0);
  const [tab, setTab] = useState<'story' | 'details'>('story');
  const [selectedSize, setSelectedSize] = useState('L');

  if (!products.length) return null;

  const current = products[index] || products[0];
  const total = products.length;

  const next = () => setIndex((prev) => (prev + 1) % total);
  const prev = () => setIndex((prev) => (prev - 1 + total) % total);

  const photo = current.images?.[0] || '/assets/img/p-guardian.webp';
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <section className="selector" id="selector" aria-label="T-shirt selector">
      <div className="sel-track" id="selTrack">
        <div className="sel-root" id="selRoot">
          <div className="sel-canvas" id="selCanvas">
            <p className="sel-label">02 — Selector</p>

            {/* Pagination dots */}
            <div className="sel-pager" role="tablist" aria-label="Choose a design">
              {products.map((p, i) => (
                <button
                  key={p.id || i}
                  type="button"
                  role="tab"
                  className={`sel-dot ${i === index ? 'is-active' : ''}`}
                  aria-selected={i === index}
                  onClick={() => setIndex(i)}
                  aria-label={p.name}
                >
                  <i />
                </button>
              ))}
            </div>

            {/* Arc / Image Plate */}
            <div className="sel-plates" id="selPlates">
              <div className="sel-orbit">
                <div className="sel-arch">
                  <img
                    src={photo}
                    alt={`${current.name} tee`}
                    draggable="false"
                    className="transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  />
                </div>
                <span className="sel-num">
                  {String(index + 1).padStart(3, '0')}
                </span>
              </div>
            </div>

            {/* Title Lockup */}
            <div className="sel-head" id="selHead">
              <div className="sel-hd">
                <p className="sel-eye">{current.editionLabel}</p>
                <h3>
                  <span className="sel-t1">{current.name.split(' ')[0]}</span>
                  <span className="sel-t2">
                    {current.name.split(' ').slice(1).join(' ') || 'EDITION'}
                  </span>
                </h3>
              </div>
            </div>

            {/* Action buttons */}
            <div className="sel-acts">
              <button
                type="button"
                className="sel-btn"
                id="selQuick"
                onClick={() => onOpenQuickView(current)}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2 fill-none stroke-current stroke-2">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4 4" />
                </svg>
                Quick view
              </button>
              <button
                type="button"
                className="sel-btn"
                id="selStudio"
                onClick={() => {
                  onSelectStudio(index);
                  document
                    .getElementById('studio')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2 fill-none stroke-current stroke-2">
                  <path d="M12 3 4 7v10l8 4 8-4V7z" />
                  <path d="M4 7l8 4 8-4M12 11v10" />
                </svg>
                Try in studio
              </button>
            </div>

            {/* Details & Story Card */}
            <div className="sel-card" id="selCard">
              <div className="sel-tabs" role="tablist" aria-label="Design details">
                <button
                  type="button"
                  role="tab"
                  className={`sel-tab ${tab === 'story' ? 'is-active' : ''}`}
                  aria-selected={tab === 'story'}
                  onClick={() => setTab('story')}
                >
                  Story
                </button>
                <button
                  type="button"
                  role="tab"
                  className={`sel-tab ${tab === 'details' ? 'is-active' : ''}`}
                  aria-selected={tab === 'details'}
                  onClick={() => setTab('details')}
                >
                  Details
                </button>
              </div>

              <div className="sel-bodies" id="selBodies">
                <div className="sel-body">
                  <div className="sel-badge">
                    <b>{String(index + 1).padStart(2, '0')}</b>
                    <span>/ {String(total).padStart(2, '0')}</span>
                  </div>
                  <p className="sel-name">{current.name}</p>
                  <p className="sel-col">{current.subtitle || current.material}</p>

                  {tab === 'story' ? (
                    <div className="sel-txt">
                      <p>{current.description}</p>
                    </div>
                  ) : (
                    <ul className="sel-list">
                      <li>Oversized fit silhouette</li>
                      <li>High-density screenprint artwork</li>
                      <li>Official woven gold neck label</li>
                      <li>Packaged in rigid gift box with seal</li>
                    </ul>
                  )}

                  <div className="sel-sizes" role="radiogroup" aria-label="Size">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={selectedSize === s}
                        onClick={() => setSelectedSize(s)}
                        className={selectedSize === s ? 'is-active' : ''}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="sel-add"
                    onClick={() => onAddToBag(current, selectedSize)}
                  >
                    Add to enquiry
                    <svg viewBox="0 0 24 24" className="w-4 h-4 ml-2 fill-none stroke-current stroke-2">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Thumbnail Scrubber Strip */}
            <div className="sel-strip">
              <button
                type="button"
                className="sel-arrow"
                onClick={prev}
                aria-label="Previous design"
              >
                <svg viewBox="0 0 12 16" className="w-3 h-4 fill-current">
                  <path d="M11 0v16L0 8z" />
                </svg>
              </button>

              <div className="sel-win">
                <div className="sel-thumbs">
                  {products.map((p, i) => (
                    <div key={p.id || i} className="sel-th">
                      <button
                        type="button"
                        aria-current={i === index}
                        onClick={() => setIndex(i)}
                      >
                        <img
                          src={p.images?.[0] || '/assets/img/p-guardian.webp'}
                          alt={p.name}
                        />
                        <span>{p.name}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="sel-arrow"
                onClick={next}
                aria-label="Next design"
              >
                <svg viewBox="0 0 12 16" className="w-3 h-4 fill-current">
                  <path d="M1 0v16l11-8z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
