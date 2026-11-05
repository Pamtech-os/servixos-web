import type { CSSProperties } from 'react';
import type { WebsitePublicData } from '../types';
import { Reveal } from '../reveal';
import { Magnetic, Parallax, ScrollProgress, SplitWords } from './effects';
import { Icon, contactItems } from './parts';
import { buildSiteModel, siteStats } from './site-model';

const INK = '#0b0b0f';
const PAPER = '#f6f4ef';

function Marquee({ items, reverse = false, className, style }: { items: string[]; reverse?: boolean; className?: string; style?: CSSProperties }) {
  // The list is rendered twice so the -50% loop lands exactly where it started
  const loop = [...items, ...items];
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className ?? ''}`} style={style}>
      <div className={`inline-flex ${reverse ? 'marquee-rev' : 'marquee'}`}>
        {loop.map((item, i) => (
          <span key={i} className='mx-6 inline-flex items-center gap-6' aria-hidden={i >= items.length}>
            {item}
            <span className='inline-block h-3 w-3 rotate-45 bg-current opacity-60' />
          </span>
        ))}
      </div>
    </div>
  );
}

function SpinningBadge({ text, color }: { text: string; color: string }) {
  return (
    <a href='booking' className='spin-badge-wrap relative flex h-36 w-36 items-center justify-center rounded-full sm:h-44 sm:w-44' style={{ background: color }} aria-label='Book now'>
      <svg className='spin-badge absolute inset-0 h-full w-full' viewBox='0 0 200 200' aria-hidden='true'>
        <defs>
          <path id='badge-circle' d='M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0' />
        </defs>
        <text fill='#fff' fontSize='17' fontWeight='800' letterSpacing='5'>
          <textPath href='#badge-circle'>{`${text} • BOOK NOW • `.toUpperCase()}</textPath>
        </text>
      </svg>
      <Icon name='arrow' className='relative h-9 w-9 -rotate-45 text-white transition-transform duration-300' strokeWidth={2.6} />
    </a>
  );
}

/** Bold editorial template: giant moving type, marquee strips, parallax, magnetic buttons and a spinning badge. */
export default function KineticTemplate({ data }: { data: WebsitePublicData }) {
  const m = buildSiteModel(data);
  const { primary: p, secondary: s } = m;
  const contacts = contactItems(m);
  const marqueeItems = m.services.length ? m.services.map((x) => x.name) : [m.category];

  return (
    <>
      <style>{`
        @keyframes marquee { to { transform: translateX(-50%); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 50% { opacity: 0; } }
        .marquee { animation: marquee 28s linear infinite; }
        .marquee-rev { animation: marquee 32s linear infinite reverse; }
        .marquee-wrap:hover .marquee, .marquee-wrap:hover .marquee-rev { animation-play-state: paused; }
        .spin-badge { animation: spin 14s linear infinite; }
        .spin-badge-wrap:hover .spin-badge { animation-duration: 3s; }
        .spin-badge-wrap:hover svg + svg { transform: rotate(45deg) scale(1.15); }
        .cursor-blink { animation: blink 1s steps(1) infinite; }
        .k-row { position: relative; isolation: isolate; overflow: hidden; }
        .k-row::before {
          content: ''; position: absolute; inset: 0; z-index: -1;
          background: ${p}; transform: scaleY(0); transform-origin: bottom;
          transition: transform .5s cubic-bezier(.77,0,.18,1);
        }
        .k-row:hover::before { transform: scaleY(1); }
        .k-row:hover { color: #fff; }
        .k-row:hover .k-muted { color: rgba(255,255,255,.8); }
        .k-row:hover .k-num { -webkit-text-stroke-color: #fff; }
        .k-row .k-thumb { opacity: 0; transform: scale(.6) rotate(-8deg); transition: opacity .4s ease, transform .5s cubic-bezier(.34,1.56,.64,1); }
        .k-row:hover .k-thumb { opacity: 1; transform: scale(1) rotate(4deg); }
        .k-row .k-arrow { transition: transform .4s ease; }
        .k-row:hover .k-arrow { transform: rotate(-45deg); }
        .k-num { -webkit-text-stroke: 1.5px ${INK}; color: transparent; }
        .k-btn { position: relative; overflow: hidden; isolation: isolate; }
        .k-btn::before {
          content: ''; position: absolute; inset: 0; z-index: -1; background: ${s};
          transform: translateX(-101%); transition: transform .45s cubic-bezier(.77,0,.18,1);
        }
        .k-btn:hover::before { transform: translateX(0); }
        .k-underline { background: linear-gradient(${p}, ${p}) no-repeat 0 92% / 0% 18%; transition: background-size .6s cubic-bezier(.77,0,.18,1); }
        .k-underline:hover { background-size: 100% 18%; }
        @media (prefers-reduced-motion: reduce) {
          .marquee, .marquee-rev, .spin-badge, .cursor-blink { animation: none !important; }
        }
      `}</style>

      <ScrollProgress background={`linear-gradient(90deg, ${p}, ${s})`} />

      <main className='overflow-x-hidden' style={{ background: PAPER, color: INK }}>
        {/* ── HERO ── */}
        <section className='relative flex min-h-screen flex-col justify-center overflow-hidden px-5 pb-16 pt-16 sm:px-8'>
          <div className='mx-auto w-full max-w-7xl'>
            <Reveal className='mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[.3em]'>
              <span className='h-px w-12' style={{ background: INK }} />
              {m.tagline}
              <span className='cursor-blink' style={{ color: p }}>_</span>
            </Reveal>

            <h1 className='font-black uppercase leading-[.92] tracking-[-0.04em]' style={{ fontSize: 'clamp(3rem, 10vw, 9rem)' }}>
              {m.hero.lead && <SplitWords text={m.hero.lead} stagger={0.06} />}{' '}
              <SplitWords text={m.hero.accent} stagger={0.06} delay={0.2} wordStyle={{ color: p, fontStyle: 'italic' }} />
            </h1>

            <div className='mt-12 grid items-end gap-10 lg:grid-cols-[1fr_auto]'>
              <Reveal delay={0.5}>
                <p className='max-w-xl text-lg font-medium leading-relaxed opacity-70 sm:text-xl'>{m.hero.sub}</p>
                <div className='mt-9 flex flex-wrap items-center gap-6'>
                  <Magnetic>
                    <a href='booking' className='k-btn inline-flex items-center gap-3 rounded-full px-9 py-4 text-sm font-bold uppercase tracking-widest text-white' style={{ background: INK }}>
                      {m.hero.cta} <Icon name='arrow' />
                    </a>
                  </Magnetic>
                  <a href='#services' className='k-underline text-sm font-bold uppercase tracking-widest'>See services</a>
                </div>
              </Reveal>
              <Reveal delay={0.7} className='justify-self-start lg:justify-self-end'>
                <Magnetic strength={0.25}>
                  <SpinningBadge text={m.name} color={p} />
                </Magnetic>
              </Reveal>
            </div>
          </div>

          {m.hero.image && (
            <Parallax speed={180} className='pointer-events-none absolute -right-16 top-24 hidden w-[38vw] max-w-xl opacity-90 xl:block'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.hero.image} alt='' className='w-full rotate-3 rounded-[2rem] shadow-2xl' />
            </Parallax>
          )}
        </section>

        {/* ── MARQUEE STRIPS ── */}
        <section className='marquee-wrap relative py-10' aria-label='Services'>
          <Marquee items={marqueeItems} className='-rotate-2 py-5 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl' style={{ background: p }} />
          <Marquee items={marqueeItems} reverse className='rotate-1 border-y-2 py-4 text-2xl font-black uppercase tracking-tight sm:text-4xl' style={{ borderColor: INK, color: INK, background: PAPER }} />
        </section>

        {/* ── SERVICES as big hover rows ── */}
        <section id='services' className='px-5 py-24 sm:px-8'>
          <div className='mx-auto max-w-7xl'>
            <div className='mb-14 flex flex-wrap items-end justify-between gap-6'>
              <h2 className='font-black uppercase leading-none tracking-[-0.03em]' style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)' }}>
                <SplitWords text='What we do' inView />
              </h2>
              <Reveal className='max-w-xs text-sm font-medium opacity-60'>
                {m.services.length} {m.services.length === 1 ? 'service' : 'services'}, done properly by {m.name}.
              </Reveal>
            </div>

            <div className='border-t-2' style={{ borderColor: INK }}>
              {m.services.map((service, i) => (
                <Reveal key={service.name} delay={Math.min(i, 4) * 0.06}>
                  <a href='booking' className='k-row group flex items-center gap-5 border-b-2 px-2 py-7 transition-colors duration-500 sm:gap-10 sm:px-6' style={{ borderColor: INK }}>
                    <span className='k-num w-14 shrink-0 text-3xl font-black sm:w-20 sm:text-5xl'>{String(i + 1).padStart(2, '0')}</span>
                    <span className='min-w-0 flex-1'>
                      <span className='block text-2xl font-black uppercase tracking-tight sm:text-4xl'>{service.name}</span>
                      {service.description && <span className='k-muted mt-2 block max-w-2xl text-sm opacity-60 sm:text-base'>{service.description}</span>}
                    </span>
                    {service.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={service.image} alt='' loading='lazy' className='k-thumb hidden h-24 w-32 shrink-0 rounded-xl object-cover shadow-xl md:block' />
                    )}
                    {service.price && <span className='hidden shrink-0 text-sm font-bold sm:block'>{service.price}</span>}
                    <Icon name='arrow' className='k-arrow h-7 w-7 shrink-0' strokeWidth={2.4} />
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className='px-5 py-20 text-white sm:px-8' style={{ background: INK }}>
          <div className='mx-auto grid max-w-7xl gap-12 sm:grid-cols-3'>
            {siteStats(m).map(({ value, label }, i) => (
              <Reveal key={label} delay={i * 0.12} className='border-l-2 pl-6'>
                <span className='block text-xs font-bold uppercase tracking-[.3em] opacity-50'>{label}</span>
                <span className='mt-3 block break-words text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl' style={{ color: i === 1 ? s : p }}>{value}</span>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── WHY US / WHO WE SERVE ── */}
        {(m.valueProposition || m.audience.length > 0) && (
          <section className='px-5 py-28 sm:px-8'>
            <div className='mx-auto max-w-6xl'>
              {m.valueProposition && (
                <>
                  <Reveal className='mb-6 text-xs font-bold uppercase tracking-[.3em]'>
                    <span style={{ color: p }}>●</span> Why {m.name}
                  </Reveal>
                  <p className='mb-16 font-black leading-[1.05] tracking-tight' style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
                    <SplitWords text={m.valueProposition} inView stagger={0.03} />
                  </p>
                </>
              )}
              {m.audience.length > 0 && (
                <div className='flex flex-wrap gap-3'>
                  {m.audience.map((customer, i) => (
                    <Reveal key={customer} delay={i * 0.05}>
                      <span className='inline-block rounded-full border-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:-rotate-3 hover:bg-[#0b0b0f] hover:text-white' style={{ borderColor: INK }}>
                        {customer}
                      </span>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── ABOUT ── */}
        {m.about && (
          <section id='about' className='overflow-hidden px-5 py-24 sm:px-8' style={{ background: `${p}12` }}>
            <div className='mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2'>
              <Parallax speed={100}>
                {m.about.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.about.image} alt={`The team behind ${m.name}`} loading='lazy' className='w-full -rotate-2 rounded-[2rem] border-2 shadow-[12px_12px_0_0]' style={{ borderColor: INK, color: INK }} />
                ) : (
                  <div className='flex aspect-square -rotate-2 items-center justify-center rounded-[2rem] border-2 shadow-[12px_12px_0_0]' style={{ borderColor: INK, color: INK, background: p }}>
                    <span className='text-[12rem] font-black uppercase leading-none text-white'>{m.name.charAt(0)}</span>
                  </div>
                )}
              </Parallax>
              <div>
                <Reveal className='mb-5 text-xs font-bold uppercase tracking-[.3em]'>Our story</Reveal>
                <h2 className='mb-7 font-black uppercase leading-[.95] tracking-tight' style={{ fontSize: 'clamp(2.25rem, 5vw, 4.5rem)' }}>
                  <SplitWords text={m.about.title} inView />
                </h2>
                <Reveal delay={0.2}>
                  <p className='mb-9 text-lg leading-relaxed opacity-70'>{m.about.body}</p>
                  <Magnetic>
                    <a href='booking' className='k-btn inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm font-bold uppercase tracking-widest text-white' style={{ background: INK }}>
                      Work with us <Icon name='arrow' />
                    </a>
                  </Magnetic>
                </Reveal>
              </div>
            </div>
          </section>
        )}

        {/* ── TESTIMONIAL ── */}
        {m.testimonial && (
          <section className='px-5 py-28 sm:px-8'>
            <div className='mx-auto max-w-5xl'>
              <span className='block font-black leading-[.6]' style={{ fontSize: '10rem', color: p }} aria-hidden='true'>&ldquo;</span>
              <blockquote className='font-black leading-[1.1] tracking-tight' style={{ fontSize: 'clamp(1.75rem, 4vw, 3.25rem)' }}>
                <SplitWords text={m.testimonial.quote} inView stagger={0.025} />
              </blockquote>
              <Reveal delay={0.3} className='mt-10 flex items-center gap-4 text-sm font-bold uppercase tracking-widest'>
                <span className='h-px w-12' style={{ background: INK }} />
                {m.testimonial.author} <span className='opacity-50'>— Verified Customer</span>
              </Reveal>
            </div>
          </section>
        )}

        {/* ── CONTACT ── */}
        <footer id='contact' className='overflow-hidden pb-10 pt-20 text-white' style={{ background: INK }}>
          <a href='booking' className='marquee-wrap block' aria-label={m.contactCta}>
            <Marquee
              items={[m.contactCta, 'Book a service']}
              className='py-6 font-black uppercase tracking-tight transition-colors hover:text-[var(--site-primary)]'
              style={{ fontSize: 'clamp(3rem, 9vw, 8rem)' }}
            />
          </a>

          <div className='mx-auto mt-16 max-w-7xl px-5 sm:px-8'>
            <div className='grid gap-10 border-t border-white/15 pt-12 md:grid-cols-[1.2fr_1fr]'>
              <div>
                <p className='mb-6 text-xs font-bold uppercase tracking-[.3em] opacity-50'>Get in touch</p>
                <Magnetic>
                  <a href='booking' className='k-btn inline-flex items-center gap-3 rounded-full px-10 py-5 text-sm font-bold uppercase tracking-widest' style={{ background: p }}>
                    Book a Service <Icon name='arrow' />
                  </a>
                </Magnetic>
              </div>
              {contacts.length > 0 && (
                <div className='space-y-5'>
                  {contacts.map((c) => {
                    const body = (
                      <>
                        <span className='block text-xs font-bold uppercase tracking-[.3em] opacity-50'>{c.label}</span>
                        <span className='k-underline mt-1 inline-block text-xl font-bold sm:text-2xl'>{c.value}</span>
                      </>
                    );
                    return c.href ? (
                      <a key={c.label} href={c.href} className='block'>{body}</a>
                    ) : (
                      <div key={c.label}>{body}</div>
                    );
                  })}
                </div>
              )}
            </div>
            <p className='mt-16 text-xs uppercase tracking-widest opacity-40'>
              © {new Date().getFullYear()} {m.name} — Powered by ServixOS
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
