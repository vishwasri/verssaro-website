'use client';

import React from 'react';

const CRAFT_CARDS = [
  {
    num: '01',
    title: 'Rigid gift box',
    desc: 'Rigid board in matte black with gold-foil emblem and heritage pattern band.',
    img: '/assets/img/box-black.webp',
    alt: 'Black rigid gift box with Guardian tee in emblem tissue',
    specs: [
      { label: 'Size', val: '310 × 230 × 70 mm' },
      { label: 'Finish', val: 'Matte black · gold foil' },
    ],
  },
  {
    num: '02',
    title: 'Double hangtag',
    desc: 'Textured board, gold foil, brass eyelet and twisted cord — black emblem tag paired with an ivory story tag.',
    img: '/assets/img/hangtags.webp',
    alt: 'Black and ivory VERSSARO hangtags with brass eyelets',
    specs: [
      { label: 'Black', val: '55 × 90 mm' },
      { label: 'Ivory', val: '50 × 85 mm' },
    ],
  },
  {
    num: '03',
    title: 'Woven neck label',
    desc: 'Black base, ivory wordmark, gold emblem and a gold-edged size tab.',
    img: '/assets/img/woven-label.webp',
    alt: 'Black woven neck label with gold emblem and ivory wordmark',
    specs: [
      { label: 'Label', val: '60 × 25 mm' },
      { label: 'Sizes', val: 'S · M · L · XL · XXL' },
    ],
  },
  {
    num: '04',
    title: 'Bag & tissue',
    desc: 'Premium matte paper, gold print and rope handle. Tissue printed with the emblem repeat, sealed with a gold sticker.',
    img: '/assets/img/shopping-bag.webp',
    alt: 'Black VERSSARO shopping bag with gold rope handle and emblem tissue',
    specs: [
      { label: 'Bag', val: '320 × 280 × 120 mm' },
      { label: 'Tissue', val: '17 gsm · Ø32 mm seal' },
    ],
  },
];

export function CraftSection() {
  return (
    <section className="craft section" id="craft">
      <div className="sec-head sec-head--split">
        <div>
          <p className="eyebrow">
            <span className="eyebrow__line" />
            05 — The ritual
          </p>
          <h2 className="title">
            <span className="thin">Every piece</span> <b>arrives sealed</b>
          </h2>
        </div>
        <p className="sec-head__copy">
          Matte black, gold foil and an ivory emblem tissue. The VERSSARO
          packaging system is measured to the millimetre — an unboxing that feels
          like a ceremony.
        </p>
      </div>

      <div className="stack" id="stack">
        {CRAFT_CARDS.map((card) => (
          <article key={card.num} className="stack__card">
            <div className="stack__img">
              <img src={card.img} alt={card.alt} loading="lazy" />
            </div>
            <div className="stack__txt">
              <i>{card.num}</i>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              <dl>
                {card.specs.map((sp) => (
                  <div key={sp.label}>
                    <dt>{sp.label}</dt>
                    <dd>{sp.val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
