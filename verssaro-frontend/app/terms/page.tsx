import { AtelierInfoPage } from '@/components/AtelierInfoPage';

export default function TermsPage() {
  return (
    <AtelierInfoPage
      blocks={[
        {
          code: 'TERMS // 01',
          heading: 'PRIMARY ALLOCATION & BOT SHIELD',
          body: 'Limited numbered releases may enforce per-dossier quantity limits and Shield Level 5 anti-bot verification during high-velocity drops.',
        },
        {
          code: 'TERMS // 02',
          heading: 'NFC SMART-CONTRACT ROYALTY',
          body: 'Peer-to-peer ownership transfers recorded inside the VERSSARO Vault include a transparent 5.0% creator provenance royalty and reassign smart Atelier perks to the new custodian.',
        },
      ]}
      ctaHref="/shop"
      ctaLabel="RETURN TO STOREFRONT"
      eyebrow="LEGAL // CONDITIONS OF SALE & CUSTODY"
      lead="Governing terms for primary acquisitions, global courier delivery, and peer-to-peer NFC provenance transfers."
      title="TERMS OF ATELIER SERVICE."
    />
  );
}

