'use client';

import React from 'react';
import { Product } from '@/lib/types';

export function CollectionGrid({
  products,
  onOpenQuickView,
}: {
  products: Product[];
  onOpenQuickView: (product: Product) => void;
}) {
  return (
    <section className="collection section" id="collection">
      <div className="sec-head">
        <p className="eyebrow">
          <span className="eyebrow__line" />
          01 — The collection
        </p>
        <h2 className="title">
          <span className="thin">Worn</span> <b>Legends</b>
        </h2>
        <p className="sec-head__copy">
          Oversized graphic tees carrying the guardians, dancers and highlands of
          Sri Lanka. Hover to see each piece in the world, open it to choose a
          size.
        </p>
      </div>

      <div className="grid" id="productGrid">
        {products.map((p, i) => {
          const mainImg = p.images?.[0] || '/assets/img/p-guardian.webp';
          const lifestyleImg = p.images?.[1] || mainImg;

          return (
            <article
              key={p.id || p.slug}
              className="card"
              style={{ '--d': `${i * 90}ms` } as React.CSSProperties}
            >
              <button
                className="card__media group"
                data-cursor="View"
                onClick={() => onOpenQuickView(p)}
                aria-label={`Quick view ${p.name}`}
              >
                <img
                  className="card__a transition-opacity duration-700 group-hover:opacity-0"
                  src={mainImg}
                  alt={`${p.name} tee`}
                  loading="lazy"
                />
                <img
                  className="card__b absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                  src={lifestyleImg}
                  alt={`${p.name} in the world`}
                  loading="lazy"
                />
                <span className="card__tag">{p.editionLabel}</span>
                <span className="card__quick">Quick view</span>
              </button>

              <div className="card__info">
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.subtitle || `${p.capsule} · Oversized fit`}</p>
                </div>
                <button
                  className="card__add"
                  onClick={() => onOpenQuickView(p)}
                  aria-label={`Add ${p.name} to enquiry`}
                >
                  <span>+</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
