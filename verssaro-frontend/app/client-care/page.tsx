import { AtelierInfoPage } from '@/components/AtelierInfoPage';

export default function ClientCarePage() {
  return (
    <AtelierInfoPage
      blocks={[
        {
          code: 'DISPATCH // SLA',
          heading: 'COLOMBO SAME-DAY & GLOBAL DHL EXPRESS',
          body: 'Colombo courier handovers dispatch within 2 hours of order QC. Global air freight via DHL Express departs daily with complimentary coverage on orders exceeding $400 USD.',
          metrics: [
            { label: 'COLOMBO SLA', value: '2–4 HOURS' },
            { label: 'GLOBAL TRANSIT', value: '2–4 BUSINESS DAYS' },
          ],
        },
        {
          code: 'RESTORATION // PASS',
          heading: 'COMPLIMENTARY ATELIER CARE',
          body: 'Active NFC-bound garments qualify for hardware replacement, enzyme wash reconditioning, and seam reinforcement booked directly inside your Client NFC Vault.',
          metrics: [
            { label: 'TIER 01 PASSES', value: '3 PER CYCLE' },
            { label: 'TURNAROUND', value: '5 BUSINESS DAYS' },
          ],
        },
        {
          code: 'RETURNS // POLICY',
          heading: '14-DAY ARCHIVAL EXCHANGE',
          body: 'Unworn garments with intact tamper-evident seal and unbound NFC silicon may be returned or exchanged across Colombo, London, or Dubai suites within 14 days of delivery.',
          metrics: [
            { label: 'WINDOW', value: '14 DAYS FROM RECEIPT' },
            { label: 'SILICON REQUIREMENT', value: 'UNBOUND SEAL' },
          ],
        },
        {
          code: 'GARMENT // CARE',
          heading: 'COLD ENZYME & FLAT DRY',
          body: 'Wash inside-out at 30°C with mild pH-neutral detergent. Never tumble dry heavyweight 520 GSM fleece or iron directly over hem NFC silicon compartments.',
          metrics: [
            { label: 'MAX TEMP', value: '30°C GENTLE' },
            { label: 'DRYING', value: 'FLAT SHADE ONLY' },
          ],
        },
      ]}
      ctaHref="/account"
      ctaLabel="VIEW PATRON DOSSIER"
      eyebrow="CLIENT CARE // LOGISTICS & RESTORATION"
      lead="White-glove courier telemetry, customs clearance, returns protocol, and lifetime restoration servicing for VERSSARO patrons."
      title="CARE, DISPATCH & RETURNS."
    />
  );
}

