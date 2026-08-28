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
  title: 'Project A Fund VII — Performance Case Study',
  description: 'An interactive venture fund performance, Series E and LP reporting case study.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Project A Fund VII — From Fund Data to Decision Clarity',
    description: 'Explore portfolio returns, the Solarisbank Series E, capital call allocation and LP performance in one interactive case study.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Project A Fund VII performance case study' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Project A Fund VII — From Fund Data to Decision Clarity',
    description: 'Interactive venture fund performance and LP reporting case study.',
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
