import { notFound } from 'next/navigation';
import { getWebsiteData } from './get-website-data';

export default async function SiteLandingPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const data = await getWebsiteData(subdomain);
  if (!data) notFound();

  const { business, website } = data;
  const { aiContent, colorPrimary, colorSecondary } = website;

  const heroHeadline = aiContent?.hero.headline ?? `Welcome to ${business.name}`;
  const heroSub = aiContent?.hero.subheadline ?? business.description ?? business.categoryName;
  const heroCta = aiContent?.hero.ctaText ?? 'Book a Service';

  const services = aiContent?.services.length
    ? aiContent.services
    : business.services.map((name) => ({ name, description: '' }));

  const headlineWords = heroHeadline.split(' ');
  const headlineAccent = headlineWords.slice(-2).join(' ');
  const headlineMain = headlineWords.slice(0, -2).join(' ');

  return (
    <>
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0,0) scale(1) rotate(0deg); }
          33%  { transform: translate(30px,-40px) scale(1.08) rotate(8deg); }
          66%  { transform: translate(-20px,20px) scale(0.94) rotate(-4deg); }
        }
        @keyframes blob-alt {
          0%, 100% { transform: translate(0,0) scale(1) rotate(0deg); }
          33%  { transform: translate(-30px,30px) scale(1.06) rotate(-6deg); }
          66%  { transform: translate(25px,-15px) scale(0.96) rotate(4deg); }
        }
        @keyframes fade-up {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes bounce-y {
          0%,100% { transform:translateX(-50%) translateY(0); }
          50%     { transform:translateX(-50%) translateY(6px); }
        }
        @keyframes card-glow {
          0%,100% { box-shadow: 0 0 0 0 ${colorPrimary}00; }
          50%     { box-shadow: 0 0 32px 4px ${colorPrimary}22; }
        }
        .blob-a { animation: blob 14s ease-in-out infinite; }
        .blob-b { animation: blob-alt 18s ease-in-out infinite 3s; }
        .blob-c { animation: blob 11s ease-in-out infinite 6s; }
        .fu1 { animation: fade-up .7s ease-out both .05s; }
        .fu2 { animation: fade-up .7s ease-out both .18s; }
        .fu3 { animation: fade-up .7s ease-out both .32s; }
        .fu4 { animation: fade-up .7s ease-out both .48s; }
        .scroll-hint { animation: bounce-y 2s ease-in-out infinite; }
        .svc-card {
          transition: transform .28s ease, box-shadow .28s ease;
        }
        .svc-card:hover {
          transform: translateY(-8px) scale(1.01);
          box-shadow: 0 24px 48px -12px ${colorPrimary}33;
        }
        .svc-card:hover .svc-bar { transform: scaleX(1); }
        .svc-bar {
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .3s ease;
        }
        .svc-arrow { transition: transform .2s ease; }
        .svc-card:hover .svc-arrow { transform: translateX(4px); }
        .btn-primary {
          transition: transform .22s ease, box-shadow .22s ease, opacity .22s ease;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          opacity: .92;
          box-shadow: 0 14px 32px -6px ${colorPrimary}55;
        }
        .btn-outline {
          transition: transform .22s ease, background .22s ease;
        }
        .btn-outline:hover {
          transform: translateY(-2px);
          background: ${colorPrimary}12;
        }
        .contact-card {
          transition: background .2s ease, transform .2s ease;
        }
        .contact-card:hover {
          background: rgba(255,255,255,.12);
          transform: translateY(-2px);
        }
        .gradient-text {
          background: linear-gradient(135deg, ${colorPrimary} 0%, ${colorSecondary || colorPrimary + 'bb'} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .dot-grid {
          background-image: radial-gradient(circle, ${colorPrimary}22 1.5px, transparent 1.5px);
          background-size: 28px 28px;
        }
        .line-grid {
          background-image:
            linear-gradient(${colorPrimary}08 1px, transparent 1px),
            linear-gradient(90deg, ${colorPrimary}08 1px, transparent 1px);
          background-size: 64px 64px;
        }
        @media (max-width: 640px) {
          .hero-headline { font-size: 2.4rem !important; }
        }
      `}</style>

      <main>

        {/* ─────────────────────── HERO ─────────────────────── */}
        <section className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-28 text-center'>

          {/* Grid overlay */}
          <div className='pointer-events-none absolute inset-0 line-grid' aria-hidden='true' />

          {/* Animated blobs */}
          <div className='pointer-events-none absolute inset-0' aria-hidden='true'>
            <div
              className='blob-a absolute -left-48 -top-48 h-[560px] w-[560px] rounded-full opacity-[.18] blur-3xl'
              style={{ background: colorPrimary }}
            />
            <div
              className='blob-b absolute -bottom-48 -right-48 h-[640px] w-[640px] rounded-full opacity-[.14] blur-3xl'
              style={{ background: colorSecondary || colorPrimary }}
            />
            <div
              className='blob-c absolute left-[55%] top-[30%] h-[280px] w-[280px] rounded-full opacity-[.1] blur-2xl'
              style={{ background: colorPrimary }}
            />
          </div>

          {/* Content */}
          <div className='relative z-10 mx-auto max-w-4xl'>

            {/* Badge */}
            <div className='fu1 mb-7 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest ring-1'
              style={{ color: colorPrimary, background: `${colorPrimary}10`, ringColor: `${colorPrimary}30` }}>
              <span className='h-1.5 w-1.5 rounded-full' style={{ background: colorPrimary }} />
              {business.categoryName}
            </div>

            {/* Headline */}
            <h1
              className='hero-headline fu2 mb-6 font-bold leading-[1.08] tracking-tight text-gray-900'
              style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)' }}
            >
              {headlineMain && <span>{headlineMain} </span>}
              <span className='gradient-text'>{headlineAccent}</span>
            </h1>

            {/* Subheadline */}
            <p className='fu3 mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl'>
              {heroSub}
            </p>

            {/* CTAs */}
            <div className='fu4 flex flex-wrap items-center justify-center gap-4'>
              <a
                href='booking'
                className='btn-primary inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-base font-semibold text-white shadow-lg'
                style={{ background: `linear-gradient(135deg, ${colorPrimary}, ${colorSecondary || colorPrimary})` }}
              >
                {heroCta}
                <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M17 8l4 4m0 0l-4 4m4-4H3' />
                </svg>
              </a>
              <a
                href='#services'
                className='btn-outline inline-flex items-center gap-2.5 rounded-2xl border-2 px-8 py-4 text-base font-semibold'
                style={{ borderColor: colorPrimary, color: colorPrimary }}
              >
                Our Services
              </a>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className='scroll-hint pointer-events-none absolute bottom-8 left-1/2 flex flex-col items-center gap-1 opacity-30' aria-hidden='true'>
            <span className='text-[11px] font-medium uppercase tracking-widest text-gray-400'>Scroll</span>
            <svg className='h-4 w-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
            </svg>
          </div>
        </section>

        {/* ─────────────────────── SERVICES ─────────────────────── */}
        <section id='services' className='relative overflow-hidden px-5 py-24'>
          <div className='absolute inset-0 bg-gradient-to-b from-gray-50/80 to-white' />
          <div className='pointer-events-none absolute inset-0 dot-grid opacity-60' aria-hidden='true' />

          <div className='relative mx-auto max-w-6xl'>

            {/* Heading */}
            <div className='mb-16 text-center'>
              <p className='mb-3 text-xs font-semibold uppercase tracking-widest' style={{ color: colorPrimary }}>
                What We Offer
              </p>
              <h2 className='text-4xl font-bold text-gray-900 sm:text-5xl'>Our Services</h2>
              <div className='mx-auto mt-5 h-1 w-14 rounded-full' style={{ background: `linear-gradient(90deg, ${colorPrimary}, ${colorSecondary || colorPrimary})` }} />
            </div>

            {/* Cards */}
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {services.map((service) => (
                <div
                  key={service.name}
                  className='svc-card group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-7 shadow-sm'
                >
                  {/* Top accent bar */}
                  <div
                    className='svc-bar absolute inset-x-0 top-0 h-[3px] rounded-t-3xl'
                    style={{ background: `linear-gradient(90deg, ${colorPrimary}, ${colorSecondary || colorPrimary})` }}
                  />

                  {/* Icon */}
                  <div
                    className='mb-5 flex h-13 w-13 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-md'
                    style={{
                      background: `linear-gradient(135deg, ${colorPrimary}, ${colorSecondary || colorPrimary + 'cc'})`,
                      width: '3.25rem',
                      height: '3.25rem',
                    }}
                  >
                    {service.name.charAt(0)}
                  </div>

                  <h3 className='mb-2 text-[1.05rem] font-bold text-gray-900'>{service.name}</h3>
                  {service.description && (
                    <p className='mb-5 text-sm leading-relaxed text-gray-500'>{service.description}</p>
                  )}

                  <div className='mt-auto flex items-center gap-1 text-xs font-bold uppercase tracking-wide' style={{ color: colorPrimary }}>
                    Book Now
                    <svg className='svc-arrow h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
                      <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────────── STATS STRIP ─────────────────────── */}
        <section className='relative overflow-hidden px-5 py-14' style={{ background: `linear-gradient(135deg, ${colorPrimary}, ${colorSecondary || colorPrimary + 'dd'})` }}>
          <div
            className='pointer-events-none absolute inset-0 opacity-10'
            style={{
              backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
            aria-hidden='true'
          />
          <div className='relative mx-auto grid max-w-4xl grid-cols-2 gap-8 text-center text-white sm:grid-cols-3'>
            {[
              { value: `${services.length}+`, label: 'Services' },
              { value: business.categoryName, label: 'Specialty' },
              { value: '< 24h', label: 'Response Time' },
            ].map(({ value, label }) => (
              <div key={label} className='flex flex-col gap-1'>
                <span className='text-3xl font-bold tracking-tight sm:text-4xl'>{value}</span>
                <span className='text-sm font-medium text-white/70'>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────── ABOUT ─────────────────────── */}
        {(aiContent?.about || business.description) && (
          <section id='about' className='px-5 py-24'>
            <div className='mx-auto max-w-6xl'>
              <div className='grid items-center gap-14 lg:grid-cols-2'>

                {/* Text */}
                <div>
                  <p className='mb-3 text-xs font-semibold uppercase tracking-widest' style={{ color: colorPrimary }}>
                    Our Story
                  </p>
                  <h2 className='mb-5 text-4xl font-bold leading-tight text-gray-900 sm:text-5xl'>
                    {aiContent?.about.title ?? 'About Us'}
                  </h2>
                  <div className='mb-6 h-1 w-12 rounded-full' style={{ background: `linear-gradient(90deg, ${colorPrimary}, ${colorSecondary || colorPrimary})` }} />
                  <p className='mb-8 text-lg leading-relaxed text-gray-500'>
                    {aiContent?.about.body ?? business.description}
                  </p>
                  <a
                    href='booking'
                    className='btn-primary inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-semibold text-white shadow-md'
                    style={{ background: `linear-gradient(135deg, ${colorPrimary}, ${colorSecondary || colorPrimary})` }}
                  >
                    Work With Us
                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
                      <path strokeLinecap='round' strokeLinejoin='round' d='M17 8l4 4m0 0l-4 4m4-4H3' />
                    </svg>
                  </a>
                </div>

                {/* Decorative panel */}
                <div className='relative'>
                  <div
                    className='absolute -inset-6 rounded-[2rem] opacity-[.12] blur-3xl'
                    style={{ background: colorPrimary }}
                  />
                  <div className='relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-8 shadow-2xl'>
                    {/* Corner accent */}
                    <div
                      className='absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-[.08]'
                      style={{ background: colorPrimary }}
                    />
                    <div
                      className='absolute -bottom-10 -left-10 h-28 w-28 rounded-full opacity-[.06]'
                      style={{ background: colorSecondary || colorPrimary }}
                    />

                    <div className='relative space-y-5'>
                      {/* Brand initial */}
                      <div
                        className='flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg'
                        style={{ background: `linear-gradient(135deg, ${colorPrimary}, ${colorSecondary || colorPrimary})` }}
                      >
                        {business.name.charAt(0)}
                      </div>

                      <div>
                        <h3 className='text-xl font-bold text-gray-900'>{business.name}</h3>
                        <p className='mt-0.5 text-sm text-gray-400'>{business.categoryName}</p>
                      </div>

                      {/* Service pills */}
                      <div className='flex flex-wrap gap-2 pt-1'>
                        {business.services.slice(0, 5).map((s) => (
                          <span
                            key={s}
                            className='rounded-full px-3.5 py-1 text-xs font-semibold text-white'
                            style={{ background: `${colorPrimary}cc` }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Divider */}
                      <div className='h-px bg-gray-100' />

                      {/* Contact snippet */}
                      <div className='flex flex-col gap-2 text-sm text-gray-500'>
                        {business.phone && (
                          <div className='flex items-center gap-2'>
                            <svg className='h-4 w-4 shrink-0' style={{ color: colorPrimary }} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                              <path strokeLinecap='round' strokeLinejoin='round' d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                            </svg>
                            {business.phone}
                          </div>
                        )}
                        {business.email && (
                          <div className='flex items-center gap-2'>
                            <svg className='h-4 w-4 shrink-0' style={{ color: colorPrimary }} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                              <path strokeLinecap='round' strokeLinejoin='round' d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                            </svg>
                            {business.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─────────────────────── TESTIMONIAL ─────────────────────── */}
        {aiContent?.testimonialPlaceholder && (
          <section className='relative overflow-hidden px-5 py-24'>
            <div
              className='absolute inset-0'
              style={{ background: `linear-gradient(135deg, ${colorPrimary}08 0%, ${colorSecondary || colorPrimary}05 100%)` }}
            />
            <div
              className='pointer-events-none absolute inset-0 dot-grid opacity-40'
              aria-hidden='true'
            />
            <div className='relative mx-auto max-w-3xl text-center'>
              <svg
                className='mx-auto mb-8 h-14 w-14'
                style={{ color: colorPrimary, opacity: .25 }}
                fill='currentColor'
                viewBox='0 0 32 32'
                aria-hidden='true'
              >
                <path d='M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z' />
              </svg>
              <blockquote className='mb-8 text-2xl font-medium italic leading-relaxed text-gray-700 sm:text-3xl'>
                &ldquo;{aiContent.testimonialPlaceholder.quote}&rdquo;
              </blockquote>
              <div className='flex items-center justify-center gap-3'>
                <div
                  className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white'
                  style={{ background: `linear-gradient(135deg, ${colorPrimary}, ${colorSecondary || colorPrimary})` }}
                >
                  {aiContent.testimonialPlaceholder.author.charAt(0)}
                </div>
                <div className='text-left'>
                  <p className='font-bold text-gray-900'>{aiContent.testimonialPlaceholder.author}</p>
                  <p className='text-sm text-gray-400'>Verified Customer</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─────────────────────── CONTACT / FOOTER ─────────────────────── */}
        <footer id='contact' className='relative overflow-hidden px-5 py-20' style={{ background: '#0c1220' }}>
          {/* Glow orbs */}
          <div
            className='pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full opacity-20 blur-3xl'
            style={{ background: colorPrimary }}
            aria-hidden='true'
          />
          <div
            className='pointer-events-none absolute -bottom-24 -right-24 h-60 w-60 rounded-full opacity-15 blur-3xl'
            style={{ background: colorSecondary || colorPrimary }}
            aria-hidden='true'
          />

          <div className='relative mx-auto max-w-6xl'>
            {/* CTA block */}
            <div className='mb-14 text-center'>
              <p className='mb-3 text-xs font-semibold uppercase tracking-widest' style={{ color: colorPrimary }}>
                Get In Touch
              </p>
              <h2 className='mb-4 text-4xl font-bold text-white sm:text-5xl'>
                {aiContent?.contact.callToAction ?? 'Ready to get started?'}
              </h2>
              <p className='mx-auto mb-8 max-w-md text-gray-400'>
                Book a service with {business.name} and experience professional results.
              </p>
              <a
                href='booking'
                className='btn-primary inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-base font-semibold text-white shadow-xl'
                style={{ background: `linear-gradient(135deg, ${colorPrimary}, ${colorSecondary || colorPrimary})` }}
              >
                Book a Service
                <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M17 8l4 4m0 0l-4 4m4-4H3' />
                </svg>
              </a>
            </div>

            {/* Contact info cards */}
            {(business.phone || business.email || business.address) && (
              <div className='mt-10 grid gap-4 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-3'>
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className='contact-card flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.06] p-5'
                  >
                    <div
                      className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl'
                      style={{ background: `${colorPrimary}28` }}
                    >
                      <svg className='h-5 w-5' style={{ color: colorPrimary }} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                      </svg>
                    </div>
                    <div>
                      <p className='text-xs text-gray-500'>Phone</p>
                      <p className='text-sm font-semibold text-white'>{business.phone}</p>
                    </div>
                  </a>
                )}
                {business.email && (
                  <a
                    href={`mailto:${business.email}`}
                    className='contact-card flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.06] p-5'
                  >
                    <div
                      className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl'
                      style={{ background: `${colorPrimary}28` }}
                    >
                      <svg className='h-5 w-5' style={{ color: colorPrimary }} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                      </svg>
                    </div>
                    <div>
                      <p className='text-xs text-gray-500'>Email</p>
                      <p className='text-sm font-semibold text-white'>{business.email}</p>
                    </div>
                  </a>
                )}
                {business.address && (
                  <div className='flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.06] p-5'>
                    <div
                      className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl'
                      style={{ background: `${colorPrimary}28` }}
                    >
                      <svg className='h-5 w-5' style={{ color: colorPrimary }} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                        <path strokeLinecap='round' strokeLinejoin='round' d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                      </svg>
                    </div>
                    <div>
                      <p className='text-xs text-gray-500'>Address</p>
                      <p className='text-sm font-semibold text-white'>{business.address}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className='mt-14 text-center text-xs text-gray-600'>
              © {new Date().getFullYear()} {business.name}. Powered by{' '}
              <span style={{ color: colorPrimary }}>ServixOS</span>.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
