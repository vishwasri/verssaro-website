'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StorefrontShell } from '@/components/StorefrontShell';

export default function VaultPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account');
  }, [router]);

  return (
    <StorefrontShell>
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="font-headline-lg uppercase text-on-surface mb-4">
          Atelier Heritage Provenance
        </h1>
        <p className="text-on-surface-variant font-body-md mb-8">
          Every VERSSARO garment arrives sealed with bespoke packaging, serialized woven neck labels, and hand-inspected authentication.
        </p>
      </div>
    </StorefrontShell>
  );
}
