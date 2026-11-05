import type { WebsitePublicData } from '../types';
import { Reveal, RevealGroup, RevealItem } from '../reveal';
import { Magnetic, Spotlight, SplitWords, TiltCard } from './effects';
import { Icon, contactItems } from './parts';
import { buildSiteModel, siteStats } from './site-model';

const BG = '#06060c';

// Fixed star positions (golden-angle spiral) so the server and client render the same sky
const STARS = Array.from({ length: 60 }, (_, i) => ({
  left: ((i * 137.508) % 100).toFixed(2),
  top: ((i * 61.803) % 100).toFixed(2),
  size: (i % 3) + 1,
  delay: ((i * 0.37) % 4).toFixed(2),
}));

function StarField() {
  return (
    <div className='pointer-events-none absolute inset-0' aria-hidden='true'>
      {STARS.map((star, i) => (
        <span
          key={i}
          className='twinkle absolute rounded-full bg-white'
          style={{ left: `${star.left}%`, top: `${star.top}%`, width: star.size, height: star.size, animationDelay: `${star.delay}s` }}
        />
      ))}
    </div>
  );
}

function Aurora({ p, s }: { p: string; s: string }) {
  return (
    <div className='pointer-events-none absolute inset-0 overflow-hidden' aria-hidden='true'>
      <div className='aurora-a absolute -left-1/4 -top-1/3 h-[80vh] w-[90vw] rounded-full opacity-50 blur-[110px]' style={{ background: `conic-gradient(from 90deg, ${p}, ${s}, #22d3ee, ${p})` }} />
      <div className='aurora-b absolute -right-1/4 top-1/4 h-[70vh] w-[70vw] rounded-full opacity-40 blur-[120px]' style={{ background: `conic-gradient(from 200deg, ${s}, #a855f7, ${p}, ${s})` }} />
      <div className='aurora-c absolute bottom-[-30%] left-1/4 h-[60vh] w-[60vw] rounded-full opacity-30 blur-[100px]' style={{ background: `radial-gradient(circle, #34d399, transparent 70%)` }} />
    </div>
  );
}

/** Dark, glowing template: drifting aurora light, twinkling stars, cursor spotlight, neon borders and 3D tilt cards. */
export default function AuroraTemplate({ data }: { data: WebsitePublicData }) {
  const m = buildSiteModel(data);
  const { primary: p, secondary: s } = m;
  const gradient = `linear-gradient(135deg, ${p}, ${s})`;
  const contacts = contactItems(m);

  return (
    <>
      <style>{`
        @keyframes aurora-drift-a {
          0%,100% { transform: translate(0,0) rotate(0deg) scale(1); }
          50%     { transform: translate(12vw, 8vh) rotate(40deg) scale(1.15); }
        }
        @keyframes aurora-drift-b {
          0%,100% { transform: translate(0,0) rotate(0deg) scale(1.1); }
          50%     { transform: translate(-14vw, -6vh) rotate(-50deg) scale(.9); }
        }
        @keyframes aurora-drift-c {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(10vw, -10vh) scale(1.3); }
        }
        @keyframes twinkle { 0%,100% { opacity: .15; } 50% { opacity: .9; } }
        @keyframes shimmer { to { background-position: 200% center; } }
        @keyframes spin-border { to { transform: rotate(360deg); } }
        @keyframes flicker {
          0%,19%,21%,23%,80%,100% { opacity: 1; }
          20%,22%,81% { opacity: .55; }
        }
        .aurora-a { animation: aurora-drift-a 22s ease-in-out infinite; }
        .aurora-b { animation: aurora-drift-b 28s ease-in-out infinite; }
        .aurora-c { animation: aurora-drift-c 18s ease-in-out infinite; }
        .twinkle { animation: twinkle 4s ease-in-out infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, ${p}, #ffffff, ${s}, #67e8f9, ${p});
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 5s linear infinite;
        }
        .neon-btn { position: relative; isolation: isolate; overflow: hidden; }
        .neon-btn::before {
          content: ''; position: absolute; inset: -150%; z-index: -2;
          background: conic-gradient(from 0deg, ${p}, ${s}, #67e8f9, ${p});
          animation: spin-border 3s linear infinite;
        }
        .neon-btn::after {
          content: ''; position: absolute; inset: 2px; z-index: -1; border-radius: inherit;
          background: ${BG}; transition: background .3s ease;
        }
        .neon-btn:hover::after { background: ${BG}aa; }
        .neon-btn:hover { box-shadow: 0 0 40px ${p}88, 0 0 80px ${s}44; }
        .glass {
          background: linear-gradient(145deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
          border: 1px solid rgba(255,255,255,.1);
          backdrop-filter: blur(14px);
        }
        .glow-card { transition: border-color .3s ease, box-shadow .3s ease; }
        .glow-card:hover { border-color: ${p}aa; box-shadow: 0 0 0 1px ${p}55, 0 20px 60px -10px ${p}66; }
        .glow-card img { transition: transform .6s ease, filter .6s ease; filter: saturate(1.1); }
        .glow-card:hover img { transform: scale(1.08); filter: saturate(1.4) brightness(1.1); }
        .neon-num { text-shadow: 0 0 18px ${p}, 0 0 42px ${s}; animation: flicker 6s linear infinite; }
        .spin-frame { position: relative; isolation: isolate; overflow: hidden; }
        .spin-frame::before {
          content: ''; position: absolute; inset: -50%; z-index: -1;
          background: conic-gradient(from 0deg, transparent 0 60%, ${p}, ${s}, transparent 90%);
          animation: spin-border 6s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .aurora-a, .aurora-b, .aurora-c, .twinkle, .shimmer-text, .neon-btn::before,
          .neon-num, .spin-frame::before { animation: none !important; }
        }
      `}</style>

      <main className='relative overflow-x-hidden text-white' style={{ background: BG }}>
        {/* ── HERO ── */}
        <section className='relative flex min-h-screen items-center overflow-hidden px-5 py-28'>
          <Aurora p={p} s={s} />
          <StarField />
          <div
            className='pointer-events-none absolute inset-0 opacity-[.07]'
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '72px 72px',
              maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            }}
            aria-hidden='true'
          />
          <Spotlight color={p} size={600} />

          <div className={`relative z-10 mx-auto w-full ${m.hero.image ? 'grid max-w-6xl items-center gap-14 lg:grid-cols-2' : 'max-w-4xl text-center'}`}>
            <div className={m.hero.image ? 'text-center lg:text-left' : ''}>
              <Reveal>
                <span className='glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[.2em] text-white/80'>
                  <span className='h-1.5 w-1.5 rounded-full' style={{ background: p, boxShadow: `0 0 10px ${p}` }} />
                  {m.tagline}
                </span>
              </Reveal>

              <h1 className='mb-7 font-bold leading-[1.04] tracking-tight' style={{ fontSize: 'clamp(2.5rem, 6.5vw, 5.25rem)' }}>
                {m.hero.lead && <SplitWords text={m.hero.lead} />} <SplitWords text={m.hero.accent} wordClassName='shimmer-text' delay={0.3} />
              </h1>

              <Reveal delay={0.45}>
                <p className={`mb-11 max-w-xl text-lg leading-relaxed text-white/60 sm:text-xl ${m.hero.image ? 'mx-auto lg:mx-0' : 'mx-auto'}`}>{m.hero.sub}</p>
              </Reveal>

              <Reveal delay={0.6} className={`flex flex-wrap items-center gap-5 ${m.hero.image ? 'justify-center lg:justify-start' : 'justify-center'}`}>
                <Magnetic>
                  <a href='booking' className='neon-btn inline-flex items-center gap-2.5 rounded-full px-9 py-4 text-base font-semibold transition-shadow duration-300'>
                    {m.hero.cta} <Icon name='arrow' />
                  </a>
                </Magnetic>
                <a href='#services' className='group inline-flex items-center gap-2 text-base font-semibold text-white/70 transition-colors hover:text-white'>
                  Explore services <Icon name='chevron' className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                </a>
              </Reveal>
            </div>

            {m.hero.image && (
              <Reveal delay={0.35}>
                <TiltCard className='spin-frame mx-auto max-w-lg rounded-[2rem] p-[2px]' max={14}>
                  <div className='overflow-hidden rounded-[calc(2rem-2px)] bg-white/95'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.hero.image} alt={`Illustration of ${m.name}`} className='w-full' />
                  </div>
                </TiltCard>
              </Reveal>
            )}
          </div>

          <div className='pointer-events-none absolute inset-x-0 bottom-0 h-40' style={{ background: `linear-gradient(transparent, ${BG})` }} aria-hidden='true' />
        </section>

        {/* ── SERVICES ── */}
        <section id='services' className='relative overflow-hidden px-5 py-28'>
          <Spotlight color={s} size={460} />
          <div className='relative mx-auto max-w-6xl'>
            <Reveal className='mb-16 text-center'>
              <p className='mb-4 text-xs font-semibold uppercase tracking-[.25em]' style={{ color: p }}>What we offer</p>
              <h2 className='text-4xl font-bold sm:text-6xl'>
                <SplitWords text='Services, perfected.' inView />
              </h2>
            </Reveal>

            <RevealGroup className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {m.services.map((service) => (
                <RevealItem key={service.name} className='h-full'>
                  <TiltCard className='h-full rounded-3xl' max={10}>
                    <div className='glass glow-card flex h-full flex-col overflow-hidden rounded-3xl p-7'>
                      {service.image ? (
                        <div className='-mx-7 -mt-7 mb-6 aspect-[4/3] overflow-hidden bg-white/90'>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={service.image} alt='' loading='lazy' className='h-full w-full object-cover' />
                        </div>
                      ) : (
                        <div
                          className='mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold'
                          style={{ background: gradient, boxShadow: `0 0 30px ${p}88` }}
                        >
                          {service.name.charAt(0)}
                        </div>
                      )}
                      <div className='mb-2 flex items-start justify-between gap-3'>
                        <h3 className='text-lg font-bold'>{service.name}</h3>
                        {service.price && (
                          <span className='shrink-0 rounded-full border px-3 py-1 text-xs font-bold' style={{ color: p, borderColor: `${p}66`, boxShadow: `0 0 12px ${p}44` }}>
                            {service.price}
                          </span>
                        )}
                      </div>
                      {service.description && <p className='mb-6 text-sm leading-relaxed text-white/55'>{service.description}</p>}
                      <a href='booking' className='group mt-auto inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest' style={{ color: p }}>
                        Book now <Icon name='chevron' className='h-3.5 w-3.5 transition-transform group-hover:translate-x-1' />
                      </a>
                    </div>
                  </TiltCard>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className='relative px-5 py-20'>
          <div className='glass relative mx-auto grid max-w-5xl gap-10 overflow-hidden rounded-[2rem] px-8 py-14 text-center sm:grid-cols-3'>
            <div className='pointer-events-none absolute inset-0 opacity-30' style={{ background: `radial-gradient(circle at 20% 0%, ${p}, transparent 50%), radial-gradient(circle at 80% 100%, ${s}, transparent 50%)` }} aria-hidden='true' />
            {siteStats(m).map(({ value, label }, i) => (
              <Reveal key={label} delay={i * 0.15} className='relative'>
                <span className='neon-num block text-3xl font-bold tracking-tight sm:text-4xl' style={{ animationDelay: `${i * 1.7}s` }}>{value}</span>
                <span className='mt-2 block text-sm font-medium uppercase tracking-widest text-white/50'>{label}</span>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── WHY US / WHO WE SERVE ── */}
        {(m.valueProposition || m.audience.length > 0) && (
          <section className='relative px-5 py-24'>
            <div className='mx-auto grid max-w-6xl gap-8 lg:grid-cols-5'>
              {m.valueProposition && (
                <Reveal className={m.audience.length ? 'lg:col-span-3' : 'lg:col-span-5'}>
                  <div className='spin-frame h-full rounded-[2rem] p-[1.5px]'>
                    <div className='h-full rounded-[calc(2rem-1.5px)] p-10' style={{ background: BG }}>
                      <p className='mb-4 text-xs font-semibold uppercase tracking-[.25em] text-white/50'>Why {m.name}</p>
                      <p className='text-2xl font-bold leading-snug sm:text-3xl'>{m.valueProposition}</p>
                    </div>
                  </div>
                </Reveal>
              )}
              {m.audience.length > 0 && (
                <Reveal delay={0.15} className={m.valueProposition ? 'lg:col-span-2' : 'lg:col-span-5'}>
                  <div className='glass flex h-full flex-col justify-center rounded-[2rem] p-10'>
                    <p className='mb-5 text-xs font-semibold uppercase tracking-[.25em]' style={{ color: p }}>Who we serve</p>
                    <div className='flex flex-wrap gap-2.5'>
                      {m.audience.map((customer) => (
                        <span key={customer} className='rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition-all hover:border-white/40 hover:text-white' style={{ boxShadow: `inset 0 0 20px ${p}22` }}>
                          {customer}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
          </section>
        )}

        {/* ── ABOUT ── */}
        {m.about && (
          <section id='about' className='relative overflow-hidden px-5 py-28'>
            <div className='pointer-events-none absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full opacity-25 blur-[120px]' style={{ background: p }} aria-hidden='true' />
            <div className='relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2'>
              <Reveal>
                <p className='mb-4 text-xs font-semibold uppercase tracking-[.25em]' style={{ color: p }}>Our story</p>
                <h2 className='mb-6 text-4xl font-bold leading-tight sm:text-5xl'>{m.about.title}</h2>
                <p className='mb-9 text-lg leading-relaxed text-white/60'>{m.about.body}</p>
                <Magnetic>
                  <a href='booking' className='neon-btn inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-sm font-semibold'>
                    Work with us <Icon name='arrow' />
                  </a>
                </Magnetic>
              </Reveal>
              <Reveal delay={0.15}>
                <TiltCard className='spin-frame rounded-[2rem] p-[2px]'>
                  {m.about.image ? (
                    <div className='overflow-hidden rounded-[calc(2rem-2px)] bg-white/95'>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.about.image} alt={`The team behind ${m.name}`} loading='lazy' className='w-full' />
                    </div>
                  ) : (
                    <div className='flex aspect-[4/3] items-center justify-center rounded-[calc(2rem-2px)]' style={{ background: BG }}>
                      <span className='shimmer-text text-[9rem] font-bold leading-none'>{m.name.charAt(0)}</span>
                    </div>
                  )}
                </TiltCard>
              </Reveal>
            </div>
          </section>
        )}

        {/* ── TESTIMONIAL ── */}
        {m.testimonial && (
          <section className='px-5 py-24'>
            <Reveal className='glass mx-auto max-w-3xl rounded-[2rem] p-10 text-center sm:p-14'>
              <span className='shimmer-text mb-6 block text-7xl font-bold leading-none' aria-hidden='true'>&ldquo;</span>
              <blockquote className='mb-8 text-2xl font-medium leading-relaxed text-white/90 sm:text-3xl'>{m.testimonial.quote}</blockquote>
              <p className='font-bold'>{m.testimonial.author}</p>
              <p className='text-sm text-white/50'>Verified Customer</p>
            </Reveal>
          </section>
        )}

        {/* ── CONTACT ── */}
        <footer id='contact' className='relative overflow-hidden px-5 pb-12 pt-28'>
          <Aurora p={p} s={s} />
          <StarField />
          <div className='relative mx-auto max-w-5xl text-center'>
            <p className='mb-4 text-xs font-semibold uppercase tracking-[.25em] text-white/60'>Get in touch</p>
            <h2 className='mb-6 text-4xl font-bold sm:text-6xl'>
              <SplitWords text={m.contactCta} inView wordClassName='shimmer-text' />
            </h2>
            <p className='mx-auto mb-10 max-w-md text-white/60'>Book a service with {m.name} and experience professional results.</p>
            <Magnetic>
              <a href='booking' className='neon-btn inline-flex items-center gap-2.5 rounded-full px-10 py-4 text-base font-semibold'>
                Book a Service <Icon name='arrow' />
              </a>
            </Magnetic>

            {contacts.length > 0 && (
              <div className='mt-16 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3'>
                {contacts.map((c) => {
                  const body = (
                    <>
                      <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl' style={{ background: `${p}33`, color: p, boxShadow: `0 0 20px ${p}44` }}>
                        <Icon name={c.icon} className='h-5 w-5' />
                      </span>
                      <span>
                        <span className='block text-xs text-white/50'>{c.label}</span>
                        <span className='block text-sm font-semibold'>{c.value}</span>
                      </span>
                    </>
                  );
                  const cls = 'glass glow-card flex items-center gap-4 rounded-2xl p-5';
                  return c.href ? (
                    <a key={c.label} href={c.href} className={cls}>{body}</a>
                  ) : (
                    <div key={c.label} className={cls}>{body}</div>
                  );
                })}
              </div>
            )}

            <p className='mt-16 text-xs text-white/40'>
              © {new Date().getFullYear()} {m.name}. Powered by <span style={{ color: p }}>ServixOS</span>.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
