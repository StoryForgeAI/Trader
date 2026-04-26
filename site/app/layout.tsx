import type { Metadata } from 'next';
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
    <html lang="en" data-theme="light">
      <body className="font-sans">
        <Script
          id="scansell-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        {children}
      </body>
    </html>
  );
}
