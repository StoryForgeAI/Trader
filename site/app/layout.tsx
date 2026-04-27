import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import type { ReactNode } from 'react';

import { themeScript } from '@/lib/theme-script';

import './globals.css';

export const metadata: Metadata = {
  title: 'Scan Sell AI',
  description:
    'AI resell research for product images and product names.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className="flex min-h-screen flex-col font-sans">
        <Script
          id="scansell-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-[color:var(--line)] bg-[var(--surface-soft)] px-4 py-5 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center text-xs text-[var(--text-3)] sm:flex-row sm:text-left">
            <div>Copyright free • Scan Sell AI</div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/terms" className="transition hover:text-[var(--accent)]">
                Terms of Service
              </Link>
              <Link href="/privacy" className="transition hover:text-[var(--accent)]">
                Privacy Policy
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
