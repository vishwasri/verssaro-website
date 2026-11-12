import type { Metadata } from 'next';
import { Inter, Syne } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/components/StoreContext';

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'VERSSARO — Luxury Streetwear Atelier & NFC Provenance Vault',
  description:
    'Architectural heavyweight luxury streetwear crafted in Colombo with embedded NFC silicon provenance. Shop Archive 01, Shadow Weave, and verify collectibles.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${inter.variable} dark h-full antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-surface text-on-surface flex flex-col selection:bg-on-surface selection:text-surface">
        <a
          className="visually-hidden focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-on-surface focus:text-surface focus:px-4 focus:py-2 focus:font-label-caps-lg focus:uppercase"
          href="#main-content"
        >
          Skip to main content
        </a>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
