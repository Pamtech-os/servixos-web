import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getWebsiteData } from './get-website-data';

function SiteNav({
  businessName,
  primaryColor,
}: {
  businessName: string;
  primaryColor: string;
}) {
  return (
    <header
      className='sticky top-0 z-50 bg-white/95 backdrop-blur-sm'
      style={{ borderBottom: '1px solid #e5e7eb' }}
    >
      <div className='mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6'>
        <span className='text-lg font-bold text-gray-900'>{businessName}</span>
        <a
          href='booking'
          className='rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90'
          style={{ backgroundColor: primaryColor }}
        >
          Book Now
        </a>
      </div>
    </header>
  );
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const data = await getWebsiteData(subdomain);
  if (!data) notFound();

  const { colorPrimary, font } = data.website;
  const googleFont = font.replace(/\s+/g, '+');

  return (
    <>
      <link rel='preconnect' href='https://fonts.googleapis.com' />
      <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='' />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel='stylesheet'
        href={`https://fonts.googleapis.com/css2?family=${googleFont}:wght@400;500;600;700&display=swap`}
      />
      <div
        style={
          {
            '--site-primary': colorPrimary,
            fontFamily: `'${font}', sans-serif`,
          } as React.CSSProperties
        }
        className='min-h-screen bg-white text-gray-900'
      >
        <SiteNav businessName={data.business.name} primaryColor={colorPrimary} />
        {children}
      </div>
    </>
  );
}
