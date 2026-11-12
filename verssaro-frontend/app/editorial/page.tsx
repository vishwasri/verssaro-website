import { AtelierInfoPage } from '@/components/AtelierInfoPage';

export default function EditorialPage() {
  return (
    <AtelierInfoPage
      blocks={[
        {
          code: 'EDITORIAL // ARCHIVE 01',
          heading: 'BRUTALIST TROPICALISM — COLOMBO TO LONDON',
          body: 'Photographed across monolithic concrete courtyards and humid equatorial ateliers, Archive 01 interrogates the relationship between heavy 520 GSM organic cotton shields and architectural zero-margin tailoring.',
          metrics: [
            { label: 'TEXTILE DENSITY', value: '320–520 GSM' },
            { label: 'SILICON ATTESTATION', value: 'NTAG 424 DNA' },
          ],
        },
        {
          code: 'EDITORIAL // CAPSULE 04',
          heading: 'SOVEREIGN HARDWARE & BONDED SHELLS',
          body: 'Every technical outer shell in Capsule 04 incorporates 3-layer DWR membrane construction, brushed obsidian hardware, and seam-sealed interior vaults housing tamper-evident NFC chips.',
          metrics: [
            { label: 'HYDROSTATIC RATING', value: '20,000 MM' },
            { label: 'EDITION ALLOCATION', value: '150 NUMBERED UNITS' },
          ],
        },
        {
          code: 'ATELIER STUDY // 03',
          heading: 'PIGMENT ENZYME AGING & MINERAL DYES',
          body: 'Rather than synthetic surface coatings, obsidian and washed volcanic finishes undergo multi-stage stone enzyme baths to stabilize shrinkage while revealing sculptural double-needle seam geometry.',
          metrics: [
            { label: 'PRE-SHRUNK TOLERANCE', value: '< 1.2%' },
            { label: 'FINISHING ORIGIN', value: 'COLOMBO FLAGSHIP #01' },
          ],
        },
        {
          code: 'PROVENANCE // 04',
          heading: 'ON-CHAIN PHYSICAL CUSTODY',
          body: 'Each garment pairs tactile couture craft with cryptographic permanence on Polygon PoS, enabling frictionless peer-to-peer ownership handovers with built-in Atelier restoration privileges.',
          metrics: [
            { label: 'PROTOCOL', value: 'ECDSA-SECP256K1' },
            { label: 'SECONDARY ROYALTY', value: '5.0% AUTOMATIC' },
          ],
        },
      ]}
      ctaHref="/shop"
      ctaLabel="SHOP ARCHIVE 01 PIECES"
      eyebrow="JOURNAL // EDITORIAL DISPATCH"
      lead="Architectural silhouette studies, heavy-gauge knitwear monographs, and on-chain garment provenance dispatches from the VERSSARO Colombo Flagship."
      title="MONOGRAPHS ON FORM & CUSTODY."
    />
  );
}

