import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getWebsiteData } from './get-website-data';
import { resolveTemplate, type SiteTemplate } from '@/lib/website/site-templates';

interface NavTheme {
  header: string;
  bar: string;
  name: string;
  link: string;
  cta: string;
  border?: string;
  /** Overrides the brand-gradient CTA background. */
  ctaBackground?: string;
}

const NAV_THEMES: Record<SiteTemplate, NavTheme> = {
  classic: {
    header: 'sticky top-0 z-50 bg-white/90 backdrop-blur-md',
    bar: 'mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6',
    name: 'text-base font-bold text-gray-900 sm:text-lg',
    link: 'text-sm font-medium text-gray-500 transition-colors hover:text-gray-900',
    cta: 'rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md',
    border: '1px solid rgba(0,0,0,.07)',
  },
  bubbles: {
    header: 'sticky top-3 z-50 px-3',
    bar: 'mx-auto flex h-16 max-w-5xl items-center justify-between rounded-full bg-white/85 px-5 shadow-lg ring-1 ring-black/5 backdrop-blur-md sm:px-7',
    name: 'text-base font-extrabold text-gray-900 sm:text-lg',
    link: 'rounded-full px-3 py-1.5 text-sm font-bold text-gray-500 transition-all hover:-translate-y-0.5 hover:bg-gray-100 hover:text-gray-900',
    cta: 'rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-110',
  },
  aurora: {
    header: 'sticky top-0 z-50 bg-[#06060c]/95 backdrop-blur-xl',
    bar: 'mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6',
    name: 'text-base font-bold text-white sm:text-lg',
    link: 'text-sm font-medium text-white/60 transition-colors hover:text-white',
    cta: 'rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_24px_var(--site-primary)]',
    border: '1px solid rgba(255,255,255,.08)',
  },
  kinetic: {
    header: 'sticky top-0 z-50 bg-[#f6f4ef]/90 backdrop-blur-md',
    bar: 'mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8',
    name: 'text-base font-black uppercase tracking-tight text-[#0b0b0f] sm:text-lg',
    link: 'text-xs font-bold uppercase tracking-[.2em] text-[#0b0b0f]/60 transition-colors hover:text-[#0b0b0f]',
    cta: 'rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-transform hover:-rotate-3',
    border: '2px solid #0b0b0f',
    ctaBackground: '#0b0b0f',
  },
};

function SiteNav({
  businessName,
  primaryColor,
  secondaryColor,
  hasAbout,
  logoUrl,
  template,
}: {
  businessName: string;
  primaryColor: string;
  secondaryColor: string;
  hasAbout: boolean;
  logoUrl?: string;
  template: SiteTemplate;
}) {
  const theme = NAV_THEMES[template];
  return (
    <header className={theme.header} style={theme.border ? { borderBottom: theme.border } : undefined}>
      <div className={theme.bar}>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href='/' className='transition-opacity hover:opacity-70'>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={businessName} className='h-9 w-auto' />
          ) : (
            <span className={theme.name}>{businessName}</span>
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
              className={theme.link}
            >
              {label}
            </a>
          ))}
        </nav>
        <a
          href='booking'
          className={theme.cta}
          style={{
            background:
              theme.ctaBackground ?? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})`,
          }}
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
  const template = resolveTemplate(data.website.template);

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
        <SiteNav businessName={data.business.name} primaryColor={colorPrimary} secondaryColor={data.website.colorSecondary} hasAbout={hasAbout} logoUrl={data.website.logoUrl} template={template} />
        {children}
      </div>
    </>
  );
}
