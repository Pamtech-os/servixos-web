'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, LifeBuoy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ErrorPageProps {
  title?: string;
  description?: string;
  errorCode?: string;
  errorMessage?: string;
  onRetry?: () => void;
}

const ErrorPage = ({
  title = 'Something went wrong',
  description = 'An unexpected error occurred while processing your request. Our team has been notified. Please try again in a moment.',
  errorCode = '500',
  errorMessage,
  onRetry,
}: ErrorPageProps) => {
  const router = useRouter();

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        delay: Math.random() * 4,
        duration: Math.random() * 6 + 6,
      })),
    [],
  );

  const handleRetry = () => {
    if (onRetry) onRetry();
    else window.location.reload();
  };

  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12'>
      <motion.div
        className='pointer-events-none absolute left-1/2 -top-40 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-destructive/30 opacity-50 blur-3xl'
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className='pointer-events-none absolute -bottom-40 -right-40 h-[24rem] w-[24rem] rounded-full bg-secondary/20 opacity-40 blur-3xl'
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {particles.map((p) => (
        <motion.div
          key={p.id}
          className='pointer-events-none absolute rounded-full bg-destructive/40'
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -25, 0], opacity: [0.2, 0.7, 0.2] }}
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
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className='absolute inset-0 rounded-full border-2 border-destructive/40'
                animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
              />
            ))}
            <motion.div
              className='absolute inset-0 rounded-full bg-destructive/20 blur-2xl'
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className='relative flex h-full w-full items-center justify-center rounded-full bg-destructive shadow-glow'
              animate={{ rotate: [0, -4, 4, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
            >
              <AlertTriangle className='h-14 w-14 text-destructive-foreground' strokeWidth={1.75} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className='mx-auto inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-destructive'
          >
            <span className='relative flex h-2 w-2'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75' />
              <span className='relative inline-flex h-2 w-2 rounded-full bg-destructive' />
            </span>
            Error {errorCode}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className='mt-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl'
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className='mx-auto mt-3 max-w-md text-base text-muted-foreground'
          >
            {description}
          </motion.p>

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className='mx-auto mt-6 max-w-md rounded-lg border border-border bg-muted/50 p-3 text-left font-mono text-xs text-muted-foreground'
            >
              {errorMessage}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'
          >
            <Button variant='outline' size='lg' asChild className='w-full sm:w-auto'>
              <Link href='/dashboard'>
                <Home className='h-4 w-4' />
                Dashboard
              </Link>
            </Button>
            <Button size='lg' onClick={handleRetry} className='w-full gradient-bg hover:opacity-90 sm:w-auto'>
              <RefreshCw className='h-4 w-4' />
              Try again
            </Button>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.5 }}
            type='button'
            onClick={() => router.push('/settings')}
            className='mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
          >
            <LifeBuoy className='h-4 w-4' />
            Contact support
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorPage;
