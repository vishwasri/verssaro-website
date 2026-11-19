import type { Metadata } from 'next';
import './globals.css';
import './verssaro.css';
import { StoreProvider } from '@/components/StoreContext';
import { CustomCursor } from '@/components/CustomCursor';

export const metadata: Metadata = {
  title: 'VERSSARO — Sri Lankan Heritage. Modern Expression.',
  description:
    'VERSSARO is a Sri Lankan heritage apparel house reimagining island legends, guardians and cultural icons as contemporary graphic tees.',
  icons: {
    icon: '/assets/brand/favicon.svg',
  },
  openGraph: {
    title: 'VERSSARO — Sri Lankan Heritage. Modern Expression.',
    description: 'Heritage graphic tees. Guardians, dancers and island legends, worn bold.',
    images: ['/assets/img/og-cover.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-[#0a0a0a] text-[#f3ecde] flex flex-col selection:bg-[#d9b25c] selection:text-[#0a0a0a]">
        <div className="grain" aria-hidden="true" />
        <CustomCursor />
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
