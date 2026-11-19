'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminNfcRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/catalog');
  }, [router]);
  return null;
}
