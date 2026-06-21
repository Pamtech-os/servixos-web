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

  const services =
    aiContent?.services.length
      ? aiContent.services
      : business.services.map((name) => ({ name, description: '' }));

  return (
    <main>
      {/* ── Hero ── */}
      <section
        className='relative flex min-h-[80vh] flex-col items-center justify-center px-4 py-24 text-center'
        style={{ background: `linear-gradient(135deg, ${colorPrimary}18 0%, ${colorSecondary}12 100%)` }}
      >
        <h1 className='mx-auto max-w-3xl text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl'>
          {heroHeadline}
        </h1>
        <p className='mx-auto mt-6 max-w-xl text-lg text-gray-600'>{heroSub}</p>
        <div className='mt-10 flex flex-wrap items-center justify-center gap-4'>
          <a
            href='booking'
            className='rounded-xl px-8 py-3 text-base font-semibold text-white shadow-lg transition-opacity hover:opacity-90'
            style={{ backgroundColor: colorPrimary }}
          >
            {heroCta}
          </a>
          <a
            href='#services'
            className='rounded-xl border px-8 py-3 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50'
            style={{ borderColor: colorPrimary, color: colorPrimary }}
          >
            Our Services
          </a>
        </div>
      </section>

      {/* ── Services ── */}
      <section id='services' className='bg-gray-50 px-4 py-20'>
        <div className='mx-auto max-w-6xl'>
          <h2 className='mb-4 text-center text-3xl font-bold text-gray-900'>Our Services</h2>
          <p className='mb-12 text-center text-gray-500'>
            {aiContent?.about.title ? 'What we offer' : `Services by ${business.name}`}
          </p>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {services.map((service) => (
              <div
                key={service.name}
                className='rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md'
              >
                <div
                  className='mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white text-lg font-bold'
                  style={{ backgroundColor: colorPrimary }}
                >
                  {service.name.charAt(0)}
                </div>
                <h3 className='mb-2 text-base font-semibold text-gray-900'>{service.name}</h3>
                {service.description && (
                  <p className='text-sm text-gray-500'>{service.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      {(aiContent?.about || business.description) && (
        <section id='about' className='px-4 py-20'>
          <div className='mx-auto max-w-3xl text-center'>
            <h2 className='mb-6 text-3xl font-bold text-gray-900'>
              {aiContent?.about.title ?? 'About Us'}
            </h2>
            <p className='text-lg leading-relaxed text-gray-600'>
              {aiContent?.about.body ?? business.description}
            </p>
          </div>
        </section>
      )}

      {/* ── Testimonial ── */}
      {aiContent?.testimonialPlaceholder && (
        <section
          className='px-4 py-20'
          style={{ background: `linear-gradient(135deg, ${colorPrimary}10 0%, ${colorSecondary}08 100%)` }}
        >
          <div className='mx-auto max-w-2xl text-center'>
            <svg
              className='mx-auto mb-6 h-10 w-10 opacity-30'
              style={{ color: colorPrimary }}
              fill='currentColor'
              viewBox='0 0 32 32'
              aria-hidden='true'
            >
              <path d='M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z' />
            </svg>
            <blockquote className='text-xl font-medium italic text-gray-700'>
              &ldquo;{aiContent.testimonialPlaceholder.quote}&rdquo;
            </blockquote>
            <p className='mt-4 font-semibold' style={{ color: colorPrimary }}>
              — {aiContent.testimonialPlaceholder.author}
            </p>
          </div>
        </section>
      )}

      {/* ── Contact / Footer ── */}
      <footer className='bg-gray-900 px-4 py-16 text-white'>
        <div className='mx-auto max-w-6xl'>
          <div className='mb-10 text-center'>
            <h2 className='mb-3 text-2xl font-bold'>
              {aiContent?.contact.callToAction ?? `Contact ${business.name}`}
            </h2>
            <a
              href='booking'
              className='inline-block rounded-xl px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90'
              style={{ backgroundColor: colorPrimary }}
            >
              Book a Service
            </a>
          </div>

          {(business.phone || business.email || business.address) && (
            <div className='flex flex-wrap justify-center gap-8 border-t border-white/10 pt-10 text-sm text-gray-400'>
              {business.phone && (
                <a href={`tel:${business.phone}`} className='hover:text-white'>
                  {business.phone}
                </a>
              )}
              {business.email && (
                <a href={`mailto:${business.email}`} className='hover:text-white'>
                  {business.email}
                </a>
              )}
              {business.address && <span>{business.address}</span>}
            </div>
          )}

          <p className='mt-10 text-center text-xs text-gray-600'>
            © {new Date().getFullYear()} {business.name}. Powered by ServixOS.
          </p>
        </div>
      </footer>
    </main>
  );
}
