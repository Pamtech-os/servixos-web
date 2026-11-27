'use client';

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent, ReactNode } from 'react';

const EASE = [0.22, 1, 0.36, 1] as const;

/** True on mouse/trackpad devices; pointer-tracking effects are skipped on touch screens. */
function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    setFine(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, []);
  return fine;
}

// Linear congruential generator — seeded so server and client render identical bubbles (no hydration mismatch)
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

interface BubbleSpec {
  left: number;
  size: number;
  duration: number;
  delay: number;
  sway: number;
  color: string;
}

function makeBubbles(count: number, colors: string[]): BubbleSpec[] {
  const rand = seeded(count * 97 + colors.join('').length);
  return Array.from({ length: count }, (_, i) => ({
    left: rand() * 100,
    size: 18 + rand() * 70,
    duration: 11 + rand() * 14,
    delay: -rand() * 25,
    sway: 20 + rand() * 50,
    color: colors[i % colors.length],
  }));
}

function Bubble({ spec }: { spec: BubbleSpec }) {
  const [popped, setPopped] = useState(false);
  const [generation, setGeneration] = useState(0);

  const pop = () => {
    if (popped) return;
    setPopped(true);
    // A fresh bubble floats up from the bottom after the burst finishes
    window.setTimeout(() => {
      setPopped(false);
      setGeneration((g) => g + 1);
    }, 900);
  };

  return (
    <span
      key={generation}
      className='bubble-rise pointer-events-auto absolute bottom-0'
      style={
        {
          left: `${spec.left}%`,
          width: spec.size,
          height: spec.size,
          animationDuration: `${spec.duration}s`,
          animationDelay: generation === 0 ? `${spec.delay}s` : '0s',
          '--sway': `${spec.sway}px`,
        } as CSSProperties
      }
      onPointerEnter={pop}
      onClick={pop}
      aria-hidden='true'
    >
      <span
        className={`bubble-body block h-full w-full rounded-full ${popped ? 'bubble-popped' : ''}`}
        style={{
          background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,.95) 0 9%, rgba(255,255,255,.25) 10% 26%, ${spec.color}33 55%, ${spec.color}66 100%)`,
          boxShadow: `inset 0 0 12px ${spec.color}55, 0 0 18px ${spec.color}22`,
          border: `1px solid ${spec.color}55`,
        }}
      />
      {popped && (
        <span className='bubble-burst absolute inset-0 rounded-full' style={{ borderColor: spec.color }} />
      )}
    </span>
  );
}

/** A field of glossy bubbles rising forever; hover or tap one to pop it. */
export function BubbleField({ colors, count = 18 }: { colors: string[]; count?: number }) {
  const reduceMotion = useReducedMotion();
  const [bubbles] = useState(() => makeBubbles(count, colors));
  if (reduceMotion) return null;
  return (
    <div className='pointer-events-none absolute inset-0 overflow-hidden' aria-hidden='true'>
      <style>{`
        @keyframes bubble-rise {
          0%   { transform: translate3d(0, 110%, 0); opacity: 0; }
          8%   { opacity: 1; }
          25%  { transform: translate3d(var(--sway), -25vh, 0); }
          50%  { transform: translate3d(calc(var(--sway) * -1), -55vh, 0); }
          75%  { transform: translate3d(var(--sway), -85vh, 0); }
          100% { transform: translate3d(0, -120vh, 0); opacity: .9; }
        }
        @keyframes bubble-wobble {
          0%,100% { border-radius: 50%; transform: scale(1); }
          33%     { border-radius: 46% 54% 52% 48%; transform: scale(1.04, .97); }
          66%     { border-radius: 54% 46% 48% 52%; transform: scale(.97, 1.04); }
        }
        @keyframes bubble-pop {
          0%   { transform: scale(1); opacity: 1; }
          40%  { transform: scale(1.3); opacity: .8; }
          100% { transform: scale(0); opacity: 0; }
        }
        @keyframes bubble-burst {
          0%   { transform: scale(.8); opacity: 1; border-width: 3px; }
          100% { transform: scale(2.2); opacity: 0; border-width: 0; }
        }
        .bubble-rise { animation: bubble-rise linear infinite; cursor: crosshair; }
        .bubble-body { animation: bubble-wobble 4s ease-in-out infinite; }
        .bubble-popped { animation: bubble-pop .35s ease-out forwards; }
        .bubble-burst { border-style: dashed; animation: bubble-burst .5s ease-out forwards; }
      `}</style>
      {bubbles.map((spec, i) => (
        <Bubble key={i} spec={spec} />
      ))}
    </div>
  );
}

/** A soft glow that follows the cursor across its parent. */
export function Spotlight({ color, size = 520 }: { color: string; size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent || !fine || reduceMotion) return;
    let frame = 0;
    const onMove = (e: globalThis.PointerEvent) => {
      cancelAnimationFrame(frame);
      // One style write per frame, however fast the pointer moves
      frame = requestAnimationFrame(() => {
        const rect = parent.getBoundingClientRect();
        el.style.setProperty('--sx', `${e.clientX - rect.left}px`);
        el.style.setProperty('--sy', `${e.clientY - rect.top}px`);
        el.style.opacity = '1';
      });
    };
    const onLeave = () => (el.style.opacity = '0');
    parent.addEventListener('pointermove', onMove);
    parent.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      parent.removeEventListener('pointermove', onMove);
      parent.removeEventListener('pointerleave', onLeave);
    };
  }, [fine, reduceMotion]);

  return (
    <div
      ref={ref}
      className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500'
      style={{
        background: `radial-gradient(${size}px circle at var(--sx, 50%) var(--sy, 50%), ${color}2e, transparent 60%)`,
      }}
      aria-hidden='true'
    />
  );
}

/** Tilts toward the cursor in 3D with a moving glare highlight. */
export function TiltCard({
  children,
  className,
  max = 12,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const fine = useFinePointer();
  const reduceMotion = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 18 };
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring);
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const glare = useTransform(
    [glareX, glareY],
    ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,.22), transparent 55%)`,
  );

  if (!fine || reduceMotion) return <div className={className}>{children}</div>;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      className={`relative ${className ?? ''}`}
      style={{ rotateX, rotateY, transformPerspective: 900, transformStyle: 'preserve-3d' }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
      <motion.div
        className='pointer-events-none absolute inset-0 rounded-[inherit]'
        style={{ background: glare }}
        aria-hidden='true'
      />
    </motion.div>
  );
}

/** Pulls its child toward the cursor while hovered. */
export function Magnetic({
  children,
  className,
  strength = 0.35,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const fine = useFinePointer();
  const reduceMotion = useReducedMotion();
  const x = useSpring(0, { stiffness: 180, damping: 14 });
  const y = useSpring(0, { stiffness: 180, damping: 14 });

  if (!fine || reduceMotion) return <div className={`inline-block ${className ?? ''}`}>{children}</div>;

  return (
    <motion.div
      className={`inline-block ${className ?? ''}`}
      style={{ x, y }}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left - rect.width / 2) * strength);
        y.set((e.clientY - rect.top - rect.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** A thin bar pinned to the top of the viewport that fills as the visitor scrolls. */
export function ScrollProgress({ background }: { background: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return (
    <motion.div
      className='fixed inset-x-0 top-0 z-[60] h-1 origin-left'
      style={{ scaleX, background }}
      aria-hidden='true'
    />
  );
}

/** Drifts its content vertically as the page scrolls past; `speed` is pixels across the full pass. */
export function Parallax({
  children,
  className,
  speed = 120,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [speed / 2, -speed / 2]);
  return (
    <motion.div ref={ref} className={className} style={reduceMotion ? undefined : { y }}>
      {children}
    </motion.div>
  );
}

/** Slides each word up from behind a mask, one after another. */
export function SplitWords({
  text,
  className,
  wordClassName,
  wordStyle,
  delay = 0,
  stagger = 0.08,
  inView = false,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  wordStyle?: CSSProperties;
  delay?: number;
  stagger?: number;
  /** Animate when scrolled into view instead of on page load. */
  inView?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const words = text.split(' ').filter(Boolean);
  const trigger = inView
    ? { whileInView: 'shown' as const, viewport: { once: true, amount: 0.4 } }
    : { animate: 'shown' as const };

  return (
    <motion.span
      className={className}
      initial={reduceMotion ? false : 'hidden'}
      {...trigger}
      variants={{ shown: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className='-mr-[0.12em] inline-block overflow-hidden pb-[0.12em] pr-[0.12em] align-bottom'>
          <motion.span
            className={`inline-block ${wordClassName ?? ''}`}
            style={wordStyle}
            variants={{
              hidden: { y: '110%', rotate: 6 },
              shown: { y: '0%', rotate: 0, transition: { duration: 0.8, ease: EASE } },
            }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/** Pops its content in with a springy overshoot when scrolled into view. */
export function SpringIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.6, y: 40 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ type: 'spring', stiffness: 260, damping: 15, delay }}
    >
      {children}
    </motion.div>
  );
}
