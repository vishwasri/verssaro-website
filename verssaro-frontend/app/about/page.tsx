import { AtelierInfoPage } from '@/components/AtelierInfoPage';

export default function AboutPage() {
  return (
    <AtelierInfoPage
      blocks={[
        {
          code: '01 // THE HOUSE',
          heading: 'COLOMBO ROOTS, GLOBAL DISTRIBUTION',
          body: 'Founded as an independent luxury streetwear house, VERSSARO engineers small-batch uniform systems shipped directly from Colombo Flagship #01, London Mayfair Suite, and Dubai Private Vault.',
          metrics: [
            { label: 'ATELIER NODES', value: 'CMB // LHR // DXB' },
            { label: 'EXPRESS DISPATCH', value: '< 2 HOURS' },
          ],
        },
        {
          code: '02 // MATERIAL STANDARD',
          heading: 'NO SYNTHETIC COMPROMISE',
          body: 'Our jerseys start at 320 GSM combed long-staple cotton and rise to 520 GSM French terry and ripstop nylon overlays. Every trim, zipper pull, and woven spec label is custom milled.',
          metrics: [
            { label: 'JERSEY WEIGHT', value: '320 GSM COMBED' },
            { label: 'FLEECE WEIGHT', value: '520 GSM TERRY' },
          ],
        },
      ]}
      ctaHref="/editorial"
      ctaLabel="READ EDITORIAL DISPATCHES"
      eyebrow="ATELIER PHILOSOPHY // EST. 2025"
      lead="VERSSARO is an architectural luxury streetwear house uniting ultra-heavy textiles, tonal brutalist craft, and encrypted physical garment provenance."
      title="ENGINEERED FOR PERMANENT ARCHIVE."
    />
  );
}

