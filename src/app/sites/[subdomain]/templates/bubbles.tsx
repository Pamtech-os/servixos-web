import type { WebsitePublicData } from '../types';
import { Reveal } from '../reveal';
import { BubbleField, SpringIn, SplitWords } from './effects';
import { Icon, contactItems } from './parts';
import { buildSiteModel, siteStats } from './site-model';

function Wave({ fill, flip = false }: { fill: string; flip?: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 h-16 overflow-hidden ${flip ? '-top-px rotate-180' : '-bottom-px'}`} aria-hidden='true'>
      <svg className='wave-slide absolute bottom-0 h-full w-[200%]' viewBox='0 0 2880 120' preserveAspectRatio='none'>
        <path
          fill={fill}
          d='M0 60 C 240 120 480 0 720 60 S 1200 120 1440 60 S 1920 0 2160 60 S 2640 120 2880 60 V120 H0 Z'
        />
      </svg>
    </div>
  );
}

/** Playful, light template: rising poppable bubbles, jelly buttons, morphing blobs and wavy sections. */
export default function BubblesTemplate({ data }: { data: WebsitePublicData }) {
  const m = buildSiteModel(data);
  const { primary: p, secondary: s } = m;
  const gradient = `linear-gradient(135deg, ${p}, ${s})`;
  const contacts = contactItems(m);

  return (
    <>
      <style>{`
        @keyframes morph {
          0%,100% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; transform: rotate(0deg); }
          33%     { border-radius: 70% 30% 46% 54% / 30% 39% 61% 70%; transform: rotate(8deg); }
          66%     { border-radius: 30% 70% 38% 62% / 62% 30% 70% 38%; transform: rotate(-6deg); }
        }
        @keyframes jelly {
          0%,100% { transform: scale(1,1); }
          25%     { transform: scale(1.12,.88); }
          50%     { transform: scale(.92,1.08); }
          75%     { transform: scale(1.04,.96); }
        }
        @keyframes bob {
          0%,100% { transform: translateY(0) rotate(-1deg); }
          50%     { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes wave-slide { to { transform: translateX(-50%); } }
        @keyframes hue-wash {
          0%,100% { background-position: 0% 50%; }
          50%     { background-position: 100% 50%; }
        }
        .morph { animation: morph 12s ease-in-out infinite; }
        .bob { animation: bob 5s ease-in-out infinite; }
        .wave-slide { animation: wave-slide 14s linear infinite; }
        .jelly:hover { animation: jelly .6s ease; }
        .bub-card { transition: transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .35s ease; }
        .bub-card:hover { transform: translateY(-10px) rotate(-1deg); box-shadow: 0 30px 60px -20px ${p}55; }
        .bub-card:hover .bub-icon { animation: jelly .6s ease; }
        .bub-text {
          background: linear-gradient(90deg, ${p}, ${s}, ${p});
          background-size: 200% 100%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: hue-wash 6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .morph, .bob, .wave-slide, .bub-text, .jelly:hover, .bub-card:hover .bub-icon { animation: none !important; }
        }
      `}</style>

      <main className='overflow-x-hidden' style={{ background: `linear-gradient(180deg, ${p}0d 0%, #ffffff 40%, ${s}0d 100%)` }}>
        {/* ── HERO ── */}
        <section className='relative flex min-h-screen items-center overflow-hidden px-5 pb-32 pt-20'>
          <div className='morph pointer-events-none absolute -left-32 top-10 h-96 w-96 opacity-25 blur-2xl' style={{ background: gradient }} aria-hidden='true' />
          <div className='morph pointer-events-none absolute -right-20 bottom-20 h-80 w-80 opacity-20 blur-2xl' style={{ background: s, animationDelay: '-4s' }} aria-hidden='true' />
          <BubbleField colors={[p, s, '#7dd3fc']} count={22} />

          <div className={`relative z-10 mx-auto w-full ${m.hero.image ? 'grid max-w-6xl items-center gap-14 lg:grid-cols-2' : 'max-w-4xl text-center'}`}>
            <div className={m.hero.image ? 'text-center lg:text-left' : ''}>
              <SpringIn>
                <span
                  className='bob mb-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold shadow-lg'
                  style={{ color: p, boxShadow: `0 10px 30px -10px ${p}66` }}
                >
                  <span className='h-2.5 w-2.5 rounded-full' style={{ background: gradient }} />
                  {m.tagline}
                </span>
              </SpringIn>

              <h1 className='mb-6 font-extrabold leading-[1.05] tracking-tight text-gray-900' style={{ fontSize: 'clamp(2.5rem, 6.5vw, 5rem)' }}>
                {m.hero.lead && <SplitWords text={m.hero.lead} />} <SplitWords text={m.hero.accent} wordClassName='bub-text' delay={0.25} />
              </h1>

              <Reveal delay={0.4}>
                <p className={`mb-10 max-w-xl text-lg leading-relaxed text-gray-600 sm:text-xl ${m.hero.image ? 'mx-auto lg:mx-0' : 'mx-auto'}`}>
                  {m.hero.sub}
                </p>
              </Reveal>

              <SpringIn delay={0.55} className={`flex flex-wrap gap-4 ${m.hero.image ? 'justify-center lg:justify-start' : 'justify-center'}`}>
                <a
                  href='booking'
                  className='jelly inline-flex items-center gap-2.5 rounded-full px-9 py-4 text-base font-bold text-white'
                  style={{ background: gradient, boxShadow: `0 16px 36px -10px ${p}99` }}
                >
                  {m.hero.cta}
                  <Icon name='arrow' />
                </a>
                <a
                  href='#services'
                  className='jelly inline-flex items-center rounded-full bg-white px-9 py-4 text-base font-bold shadow-md'
                  style={{ color: p }}
                >
                  Our Services
                </a>
              </SpringIn>
            </div>

            {m.hero.image && (
              <SpringIn delay={0.3} className='relative mx-auto w-full max-w-lg'>
                <div className='morph absolute -inset-6 opacity-40' style={{ background: gradient }} aria-hidden='true' />
                <div className='morph relative overflow-hidden bg-white p-3 shadow-2xl' style={{ animationDelay: '-6s' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.hero.image} alt={`Illustration of ${m.name}`} className='morph w-full' style={{ animationDelay: '-6s' }} />
                </div>
              </SpringIn>
            )}
          </div>

          <Wave fill='#ffffff' />
        </section>

        {/* ── SERVICES ── */}
        <section id='services' className='relative bg-white px-5 py-24'>
          <div className='mx-auto max-w-6xl'>
            <Reveal className='mb-16 text-center'>
              <span className='mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest' style={{ color: p, background: `${p}14` }}>
                What we do
              </span>
              <h2 className='text-4xl font-extrabold text-gray-900 sm:text-5xl'>
                Services that <span className='bub-text'>make you smile</span>
              </h2>
            </Reveal>

            <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
              {m.services.map((service, i) => (
                <SpringIn key={service.name} delay={(i % 3) * 0.12} className='h-full'>
                  <div className='bub-card relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border-2 bg-white p-7' style={{ borderColor: `${p}1f` }}>
                    <div className='pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10' style={{ background: gradient }} aria-hidden='true' />
                    {service.image ? (
                      <div className='-mx-3 -mt-3 mb-6 aspect-[4/3] overflow-hidden rounded-[2rem]' style={{ background: `${p}0d` }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={service.image} alt='' loading='lazy' className='h-full w-full object-cover' />
                      </div>
                    ) : (
                      <div
                        className='bub-icon mb-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-extrabold text-white'
                        style={{ background: gradient, boxShadow: `0 12px 24px -8px ${p}88` }}
                      >
                        {service.name.charAt(0)}
                      </div>
                    )}
                    <div className='mb-2 flex items-start justify-between gap-3'>
                      <h3 className='text-lg font-extrabold text-gray-900'>{service.name}</h3>
                      {service.price && (
                        <span className='shrink-0 rounded-full px-3 py-1 text-xs font-bold text-white' style={{ background: gradient }}>
                          {service.price}
                        </span>
                      )}
                    </div>
                    {service.description && <p className='mb-6 text-sm leading-relaxed text-gray-500'>{service.description}</p>}
                    <a href='booking' className='jelly mt-auto inline-flex w-fit items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold' style={{ color: p, background: `${p}12` }}>
                      Book this <Icon name='chevron' className='h-3.5 w-3.5' />
                    </a>
                  </div>
                </SpringIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS as floating bubbles ── */}
        <section className='relative overflow-hidden px-5 py-28 text-white' style={{ background: gradient }}>
          <Wave fill='#ffffff' flip />
          <BubbleField colors={['#ffffff']} count={12} />
          <div className='relative mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8'>
            {siteStats(m).map(({ value, label }, i) => (
              <SpringIn key={label} delay={i * 0.15}>
                <div
                  className='bob flex h-44 w-44 flex-col items-center justify-center rounded-full border border-white/40 bg-white/15 p-4 text-center backdrop-blur-md sm:h-52 sm:w-52'
                  style={{ animationDelay: `${i * -1.4}s`, boxShadow: 'inset 0 0 30px rgba(255,255,255,.25)' }}
                >
                  <span className='text-2xl font-extrabold leading-tight sm:text-3xl'>{value}</span>
                  <span className='mt-1 text-sm font-semibold text-white/80'>{label}</span>
                </div>
              </SpringIn>
            ))}
          </div>
          <Wave fill='#ffffff' />
        </section>

        {/* ── WHY US / WHO WE SERVE ── */}
        {(m.valueProposition || m.audience.length > 0) && (
          <section className='px-5 py-24'>
            <div className='mx-auto max-w-4xl text-center'>
              {m.valueProposition && (
                <Reveal>
                  <p className='mb-3 text-xs font-bold uppercase tracking-widest' style={{ color: p }}>Why {m.name}</p>
                  <p className='mb-12 text-3xl font-extrabold leading-snug text-gray-900 sm:text-4xl'>{m.valueProposition}</p>
                </Reveal>
              )}
              {m.audience.length > 0 && (
                <div className='flex flex-wrap justify-center gap-3'>
                  {m.audience.map((customer, i) => (
                    <SpringIn key={customer} delay={i * 0.06}>
                      <span
                        className='bob jelly inline-block rounded-full px-6 py-3 text-sm font-bold'
                        style={{ color: p, background: `${p}12`, border: `2px solid ${p}2a`, animationDelay: `${i * -0.7}s` }}
                      >
                        {customer}
                      </span>
                    </SpringIn>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── ABOUT ── */}
        {m.about && (
          <section id='about' className='px-5 py-24'>
            <div className='mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2'>
              <SpringIn className='relative mx-auto aspect-square w-full max-w-md'>
                <div className='morph absolute inset-0 opacity-90' style={{ background: gradient }} aria-hidden='true' />
                {m.about.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.about.image} alt={`The team behind ${m.name}`} loading='lazy' className='morph absolute inset-6 h-[calc(100%-3rem)] w-[calc(100%-3rem)] bg-white object-cover' style={{ animationDelay: '-3s' }} />
                ) : (
                  <div className='absolute inset-0 flex items-center justify-center text-8xl font-extrabold text-white/90'>{m.name.charAt(0)}</div>
                )}
              </SpringIn>
              <Reveal>
                <p className='mb-3 text-xs font-bold uppercase tracking-widest' style={{ color: p }}>Our story</p>
                <h2 className='mb-6 text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl'>{m.about.title}</h2>
                <p className='mb-8 text-lg leading-relaxed text-gray-600'>{m.about.body}</p>
                <a href='booking' className='jelly inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-sm font-bold text-white' style={{ background: gradient }}>
                  Work with us <Icon name='arrow' />
                </a>
              </Reveal>
            </div>
          </section>
        )}

        {/* ── TESTIMONIAL as a speech bubble ── */}
        {m.testimonial && (
          <section className='px-5 py-20'>
            <SpringIn className='relative mx-auto max-w-3xl'>
              <div className='relative rounded-[3rem] bg-white p-10 text-center shadow-2xl sm:p-14' style={{ boxShadow: `0 30px 70px -25px ${p}55` }}>
                <blockquote className='text-2xl font-bold leading-relaxed text-gray-800 sm:text-3xl'>&ldquo;{m.testimonial.quote}&rdquo;</blockquote>
                <span className='absolute -bottom-6 left-1/2 h-12 w-12 -translate-x-1/2 rotate-45 rounded-lg bg-white' aria-hidden='true' />
              </div>
              <div className='mt-12 flex items-center justify-center gap-3'>
                <span className='flex h-12 w-12 items-center justify-center rounded-full font-extrabold text-white' style={{ background: gradient }}>
                  {m.testimonial.author.charAt(0)}
                </span>
                <span className='text-left'>
                  <span className='block font-extrabold text-gray-900'>{m.testimonial.author}</span>
                  <span className='block text-sm text-gray-500'>Verified Customer</span>
                </span>
              </div>
            </SpringIn>
          </section>
        )}

        {/* ── CONTACT ── */}
        <footer id='contact' className='relative overflow-hidden px-5 pb-12 pt-32 text-white' style={{ background: gradient }}>
          <Wave fill='#ffffff' flip />
          <BubbleField colors={['#ffffff', s]} count={14} />
          <div className='relative mx-auto max-w-5xl text-center'>
            <h2 className='mb-5 text-4xl font-extrabold sm:text-6xl'>
              <SplitWords text={m.contactCta} inView />
            </h2>
            <p className='mx-auto mb-10 max-w-md text-white/80'>Book a service with {m.name} — it only takes a minute.</p>
            <SpringIn>
              <a href='booking' className='jelly inline-flex items-center gap-2.5 rounded-full bg-white px-10 py-4 text-base font-extrabold shadow-2xl' style={{ color: p }}>
                Book a Service <Icon name='arrow' />
              </a>
            </SpringIn>

            {contacts.length > 0 && (
              <div className='mt-16 flex flex-wrap justify-center gap-4'>
                {contacts.map((c, i) => {
                  const body = (
                    <>
                      <span className='flex h-11 w-11 items-center justify-center rounded-full bg-white/25'>
                        <Icon name={c.icon} className='h-5 w-5' />
                      </span>
                      <span className='text-left'>
                        <span className='block text-xs text-white/70'>{c.label}</span>
                        <span className='block text-sm font-bold'>{c.value}</span>
                      </span>
                    </>
                  );
                  const cls = 'jelly flex items-center gap-3 rounded-full border border-white/30 bg-white/15 py-2 pl-2 pr-6 backdrop-blur';
                  return (
                    <SpringIn key={c.label} delay={i * 0.1}>
                      {c.href ? <a href={c.href} className={cls}>{body}</a> : <div className={cls}>{body}</div>}
                    </SpringIn>
                  );
                })}
              </div>
            )}

            <p className='mt-16 text-xs text-white/70'>
              © {new Date().getFullYear()} {m.name}. Powered by <span className='font-bold text-white'>ServixOS</span>.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
