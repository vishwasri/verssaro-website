import React from 'react';
import Link from 'next/link';
import { StorefrontShell } from './StorefrontShell';

export interface AtelierSectionBlock {
  code: string;
  heading: string;
  body: string;
  metrics?: Array<{ label: string; value: string }>;
}

export function AtelierInfoPage({
  eyebrow,
  title,
  lead,
  blocks,
  ctaHref = '/shop',
  ctaLabel = 'EXPLORE ARCHIVE 01 CATALOG',
}: {
  eyebrow: string;
  title: string;
  lead: string;
  blocks: AtelierSectionBlock[];
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <StorefrontShell>
      <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin py-12 md:py-20 space-y-12">
        <header className="space-y-5 max-w-3xl">
          <p className="font-data-mono text-xs uppercase tracking-[0.22em] text-primary-fixed">
            {eyebrow}
          </p>
          <h1 className="font-display-xl text-4xl md:text-display-xl uppercase tracking-tight">
            {title}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            {lead}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              className="bg-on-surface text-surface hover:bg-primary-fixed px-6 py-3.5 font-label-caps-sm text-xs uppercase tracking-widest font-bold transition-colors"
              href={ctaHref}
            >
              {ctaLabel}
            </Link>
            <Link
              className="bg-surface-container-low hover:bg-surface-container text-on-surface px-6 py-3.5 font-label-caps-sm text-xs uppercase tracking-widest transition-colors"
              href="/shop"
            >
              EXPLORE COLLECTION
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blocks.map((block) => (
            <article
              className="bg-surface-container-low p-6 md:p-8 flex flex-col justify-between gap-6"
              key={block.code}
            >
              <div className="space-y-3">
                <span className="font-data-mono text-[11px] uppercase tracking-[0.2em] text-outline">
                  {block.code}
                </span>
                <h2 className="font-headline-md text-headline-md uppercase">
                  {block.heading}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  {block.body}
                </p>
              </div>

              {block.metrics && block.metrics.length > 0 ? (
                <dl className="grid grid-cols-2 gap-4 pt-4 bg-surface-container p-4">
                  {block.metrics.map((m) => (
                    <div key={m.label}>
                      <dt className="font-label-caps-sm text-[10px] uppercase text-outline">
                        {m.label}
                      </dt>
                      <dd className="font-data-mono text-sm text-on-surface mt-1">
                        {m.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </StorefrontShell>
  );
}

