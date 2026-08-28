import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3001'),
  title: 'Project A Fund VII: Reporting Case Study by Juma Ngnoubamdjum',
  description: 'Fund reporting across ten portfolio companies, aggregated cash flows, Series E impact, capital-call allocation and LP performance as of 28 August 2026.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Project A Fund VII: Reporting Case Study',
    description: 'Prepared by Juma Ngnoubamdjum: ten companies, aggregated cash flows, Series E impact, capital-call allocation and LP performance.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Project A Fund VII performance case study' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Project A Fund VII: Reporting Case Study',
    description: 'Prepared by Juma Ngnoubamdjum · Reporting date 28 August 2026.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
