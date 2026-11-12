import { AtelierInfoPage } from '@/components/AtelierInfoPage';

export default function PrivacyPage() {
  return (
    <AtelierInfoPage
      blocks={[
        {
          code: 'PRIVACY // 01',
          heading: 'ZERO-KNOWLEDGE CUSTODY RECORDS',
          body: 'Public Polygon PoS ledger receipts record only truncated wallet hashes and cryptographic garment serials. Residential shipping coordinates never touch public chains.',
        },
        {
          code: 'PRIVACY // 02',
          heading: 'DOSSIER & SESSION DATA',
          body: 'Shopping bag sessions, wishlist archives, and address books are stored exclusively to fulfill orders, calculate regional duties, and verify Tier 01 private access allocations.',
        },
      ]}
      ctaHref="/account"
      ctaLabel="VIEW CLIENT DOSSIER"
      eyebrow="LEGAL // DATA SOVEREIGNTY"
      lead="How VERSSARO Atelier Private Limited protects patron identity, residential shipping dossiers, and cryptographic wallet bindings."
      title="PATRON PRIVACY CHARTER."
    />
  );
}

