'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useClock } from '@/contexts/ClockContext';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  hour: 'numeric',
  minute: '2-digit',
});

/**
 * Replaces the portal for an employee who is clocked out: every business route refuses with
 * CLOCK_IN_REQUIRED until they clock in. Owners never see it.
 */
export default function ClockInGate() {
  const router = useRouter();
  const { auth, logout } = useAuth();
  const { clockIn, isActionPending, isClockAvailable, employeeName } = useClock();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const firstName = employeeName?.split(' ')[0] ?? auth.user?.firstName ?? null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className='flex min-h-dvh items-center justify-center bg-background p-4'>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className='w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-6 text-center shadow-xl sm:p-8'
        role='dialog'
        aria-modal='true'
        aria-labelledby='clock-in-gate-title'
      >
        <span className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
          <Clock size={26} />
        </span>
        <div className='space-y-1.5'>
          <h1 id='clock-in-gate-title' className='font-display text-xl font-bold'>
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </h1>
          <p className='text-sm text-muted-foreground'>
            Clock in to start using ServixOS. Your hours are tracked from the moment you do.
          </p>
          <p className='text-xs text-muted-foreground'>{timeFormatter.format(now)}</p>
        </div>
        <Button
          size='lg'
          className='w-full gap-2 bg-emerald-600 text-primary-foreground hover:bg-emerald-700'
          onClick={() => void clockIn()}
          disabled={isActionPending || !isClockAvailable}
          autoFocus
        >
          {isActionPending || !isClockAvailable ? (
            <Loader2 size={16} className='animate-spin' />
          ) : (
            <Clock size={16} />
          )}
          Clock in
        </Button>
        <button
          type='button'
          onClick={handleLogout}
          className='inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
        >
          <LogOut size={12} /> Log out
        </button>
      </motion.div>
    </div>
  );
}
