'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/types';
import { useStore } from './StoreContext';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToBag: (product: Product, size: string) => void;
}

export function QuickViewModal({
  product,
  onClose,
  onAddToBag,
}: QuickViewModalProps) {
  const { formatPrice } = useStore();
  const [selectedSize, setSelectedSize] = useState('L');
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  if (!product) return null;

  const gallery = product.images?.length
    ? product.images
    : ['/assets/img/p-guardian.webp'];
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div
      className="qv is-open"
      id="qv"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qvName"
    >
      <div className="qv__backdrop" onClick={onClose} />
      <div className="qv__panel">
        <button
          className="qv__close"
          onClick={onClose}
          aria-label="Close quick view"
        >
          ✕
        </button>

        {/* Media Gallery */}
        <div className="qv__media">
          <div className="qv__main">
            <img
              src={gallery[activeImgIndex] || gallery[0]}
              alt={product.name}
              id="qvMain"
            />
          </div>
          {gallery.length > 1 && (
            <div className="qv__thumbs">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  aria-current={i === activeImgIndex}
                  onClick={() => setActiveImgIndex(i)}
                >
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Garment Info */}
        <div className="qv__info">
          <p className="qv__ed" id="qvEd">
            {product.editionLabel}
          </p>
          <h3 id="qvName">{product.name}</h3>
          <p className="qv__lead" id="qvLead">
            {product.subtitle || 'Sri Lankan Heritage Graphic Piece'}
          </p>
          <p className="qv__desc" id="qvDesc">
            {product.description}
          </p>

          <p className="qv__label">Size</p>
          <div className="sizes" id="qvSizes">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={selectedSize === s}
                className={selectedSize === s ? 'is-active' : ''}
                onClick={() => setSelectedSize(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <p className="qv__price" id="qvPrice">
            {product.priceUsd
              ? formatPrice(product.priceUsd)
              : 'Price on enquiry'}
          </p>

          <div className="flex flex-col gap-2 mt-4">
            <button
              className="btn btn--gold btn--full"
              id="qvAdd"
              onClick={() => {
                onAddToBag(product, selectedSize);
                onClose();
              }}
            >
              <span>Add to enquiry list</span>
            </button>
          </div>

          <p className="qv__ship" id="qvShip">
            Availability, pricing and delivery are confirmed on enquiry.
          </p>
        </div>
      </div>
    </div>
  );
}
