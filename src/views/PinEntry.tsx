'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Delete } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import servixLogo from '@/assets/servix-logo.png';

const shuffleArray = (arr: number[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const PinEntry = () => {
  const [pin, setPin] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { auth, verifyPin, isHydrated } = useAuth();
  const [shuffledNumbers] = useState(() => shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]));

  // Arrange into grid: 3 rows of 3 + bottom row with 0
  const gridNumbers = useMemo(() => {
    const top9 = shuffledNumbers.filter((n) => n !== 0);
    const rows = [top9.slice(0, 3), top9.slice(3, 6), top9.slice(6, 9)];
    return { rows, zero: 0 };
  }, [shuffledNumbers]);

  const addDigit = useCallback((digit: number) => {
    setPin((prev) => {
      if (prev.length >= 4) return prev;
      setError('');
      return [...prev, digit.toString()];
    });
  }, []);

  const removeDigit = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, []);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) {
        addDigit(parseInt(e.key));
      } else if (e.key === 'Backspace') {
        removeDigit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addDigit, removeDigit]);

  const handleSubmit = useCallback(async () => {
    const code = pin.join('');
    if (code.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    verifyPin();
    setLoading(false);
    router.push('/dashboard');
  }, [pin, router, verifyPin]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    if (!auth.isLoggedIn) {
      router.replace('/login');
    }
  }, [auth.isLoggedIn, isHydrated, router]);

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4 && !loading) {
      handleSubmit();
    }
  }, [handleSubmit, loading, pin.length]);

  if (!isHydrated || !auth.isLoggedIn) {
    return null;
  }

  return (
    <div className='relative flex min-h-screen items-start justify-center overflow-x-hidden overflow-y-auto bg-background px-4 py-6 sm:items-center sm:py-8'>
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className='pointer-events-none absolute rounded-full opacity-15 blur-3xl'
          style={{
            width: `${180 + i * 60}px`,
            height: `${180 + i * 60}px`,
            background: i % 2 === 0 ? 'hsl(174, 72%, 50%)' : 'hsl(217, 91%, 60%)',
          }}
          animate={{
            x: [0, 50 * (i % 2 === 0 ? 1 : -1), 0],
            y: [0, 30 * (i % 2 === 0 ? -1 : 1), 0],
          }}
          transition={{ duration: 5 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
          initial={{ x: (i - 1.5) * 200, y: (i - 1.5) * 80 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className='relative z-10 w-full max-w-sm'
      >
        <div className='rounded-2xl border border-border bg-card/80 p-5 shadow-lg backdrop-blur-xl sm:p-8'>
          <motion.div
            className='mb-6 flex flex-col items-center gap-3'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <div className='relative'>
              <Image src={servixLogo} alt='Servix OS' width={48} height={48} className='h-12 w-12' />
              <motion.div
                className='absolute -right-1 -top-1'
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className='h-4 w-4 text-accent' />
              </motion.div>
            </div>
            <ShieldCheck className='h-8 w-8 text-primary' />
            <h1 className='font-display text-xl font-bold'>Enter Your PIN</h1>
            <p className='text-center text-sm text-muted-foreground'>
              Enter your 4-digit security PIN
            </p>
          </motion.div>

          {/* PIN Display Dots */}
          <div className='flex justify-center gap-4 mb-6'>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                  pin.length > i
                    ? 'border-primary bg-primary scale-110'
                    : 'border-muted-foreground/30 bg-transparent'
                }`}
                animate={pin.length > i ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className='text-center text-sm font-semibold text-orange-500 mb-4'
            >
              {error}
            </motion.p>
          )}

          {/* ATM-style Number Pad */}
          <div className='space-y-2'>
            {gridNumbers.rows.map((row, rowIdx) => (
              <div key={rowIdx} className='flex justify-center gap-2'>
                {row.map((num) => (
                  <motion.button
                    key={num}
                    type='button'
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => addDigit(num)}
                    disabled={pin.length >= 4 || loading}
                    className='flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-background text-xl font-bold text-foreground shadow-sm transition-all hover:bg-muted hover:border-primary/50 active:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed'
                  >
                    {num}
                  </motion.button>
                ))}
              </div>
            ))}
            {/* Bottom row: empty, 0, backspace */}
            <div className='flex justify-center gap-2'>
              <div className='h-16 w-16' />
              <motion.button
                type='button'
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => addDigit(0)}
                disabled={pin.length >= 4 || loading}
                className='flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-background text-xl font-bold text-foreground shadow-sm transition-all hover:bg-muted hover:border-primary/50 active:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed'
              >
                0
              </motion.button>
              <motion.button
                type='button'
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                onClick={removeDigit}
                disabled={pin.length === 0 || loading}
                className='flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground shadow-sm transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 disabled:opacity-40 disabled:cursor-not-allowed'
              >
                <Delete size={22} />
              </motion.button>
            </div>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className='mt-4 flex justify-center'>
              <motion.div
                className='h-6 w-6 rounded-full border-2 border-primary border-t-transparent'
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PinEntry;
