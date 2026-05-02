'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Compass, Home, ArrowLeft, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const pathname = usePathname() ?? '';
  const router = useRouter();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', pathname);
  }, [pathname]);

  const particles = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        delay: Math.random() * 4,
        duration: Math.random() * 6 + 6,
      })),
    []
  );

  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden hero-gradient px-4 py-12'>
      <motion.div
        className='pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl gradient-bg'
        animate={{ scale: [1, 1.15, 1], rotate: [0, 60, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className='pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl gradient-accent-bg'
        animate={{ scale: [1.1, 1, 1.1], rotate: [0, -60, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      {particles.map((p) => (
        <motion.div
          key={p.id}
          className='pointer-events-none absolute rounded-full bg-primary/40'
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className='relative z-10 w-full max-w-2xl'
      >
        <div className='glass card-shadow rounded-3xl border-border p-8 text-center md:p-14'>
          <div className='relative mx-auto mb-8 h-32 w-32'>
            <motion.div
              className='absolute inset-0 rounded-full opacity-50 blur-2xl gradient-bg'
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className='relative flex h-full w-full items-center justify-center rounded-full gradient-bg shadow-glow'
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Compass className='h-14 w-14 text-primary-foreground' strokeWidth={1.5} />
            </motion.div>
            {[0, 120, 240].map((angle, i) => (
              <motion.div
                key={i}
                className='absolute left-1/2 top-1/2 h-3 w-3'
                style={{ transformOrigin: '0 0' }}
                animate={{ rotate: [angle, angle + 360] }}
                transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className='-translate-x-16 h-3 w-3 text-accent' />
              </motion.div>
            ))}
          </div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className='gradient-text text-7xl font-bold leading-none tracking-tighter md:text-9xl'
          >
            404
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className='mt-6 text-2xl font-semibold text-foreground md:text-3xl'
          >
            Lost in space
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className='mx-auto mt-3 max-w-md text-base text-muted-foreground'
          >
            The page you&apos;re looking for has drifted off the map. Let&apos;s get you back on
            track.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className='mx-auto mt-6 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 font-mono text-xs text-muted-foreground'
          >
            <Search className='h-3.5 w-3.5 shrink-0' />
            <span className='truncate'>{pathname}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'
          >
            <Button variant='outline' size='lg' onClick={() => router.back()} className='w-full sm:w-auto'>
              <ArrowLeft className='h-4 w-4' />
              Go back
            </Button>
            <Button asChild size='lg' className='w-full gradient-bg hover:opacity-90 sm:w-auto'>
              <Link href='/dashboard'>
                <Home className='h-4 w-4' />
                Back to dashboard
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
