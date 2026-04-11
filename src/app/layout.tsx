import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { DM_Sans, Space_Grotesk } from 'next/font/google';
import { AppProviders } from '@/common/providers/app-providers';
import './globals.css';

const siteUrl = 'https://servixos.app';
const siteName = 'ServixOS';
const defaultTitle = 'ServixOS | AI-Powered Field Service Management Platform';
const defaultDescription =
  'Run your service business with confidence. Manage clients, jobs, teams, invoices, and AI insights in one modern dashboard.';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: '%s | ServixOS',
  },
  description: defaultDescription,
  applicationName: siteName,
  keywords: [
    'field service management',
    'business dashboard',
    'service company software',
    'invoice management',
    'job scheduling',
    'team management',
    'AI business insights',
  ],
  authors: [{ name: 'ServixOS' }],
  creator: 'ServixOS',
  publisher: 'ServixOS',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: defaultTitle,
    description: defaultDescription,
    siteName,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    creator: '@servixos',
  },
  category: 'business',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/favicon.ico`,
    description: defaultDescription,
  };

  return (
    <html lang='en' suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${dmSans.variable} ${spaceGrotesk.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
