import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getWebsiteData } from './get-website-data';

function SiteNav({
  businessName,
  primaryColor,
  secondaryColor,
  hasAbout,
  logoUrl,
}: {
  businessName: string;
  primaryColor: string;
  secondaryColor: string;
  hasAbout: boolean;
  logoUrl?: string;
}) {
  return (
    <header
      className='sticky top-0 z-50 bg-white/90 backdrop-blur-md'
      style={{ borderBottom: '1px solid rgba(0,0,0,.07)' }}
    >
      <div className='mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6'>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href='/' className='transition-opacity hover:opacity-70'>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={businessName} className='h-9 w-auto' />
          ) : (
            <span className='text-base font-bold text-gray-900 sm:text-lg'>{businessName}</span>
          )}
        </a>
        <nav className='hidden items-center gap-7 sm:flex'>
          {[
            { label: 'Services', href: '#services' },
            ...(hasAbout ? [{ label: 'About', href: '#about' }] : []),
            { label: 'Contact', href: '#contact' },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className='text-sm font-medium text-gray-500 transition-colors hover:text-gray-900'
            >
              {label}
            </a>
          ))}
        </nav>
        <a
          href='booking'
          className='rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md'
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
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
  const hasAbout = !!(data.website.aiContent?.about || data.business.description);

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
            scrollBehavior: 'smooth',
          } as React.CSSProperties
        }
        className='min-h-screen bg-white text-gray-900'
      >
        <SiteNav businessName={data.business.name} primaryColor={colorPrimary} secondaryColor={data.website.colorSecondary} hasAbout={hasAbout} logoUrl={data.website.logoUrl} />
        {children}
      </div>
    </>
  );
}
