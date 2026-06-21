'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrialingBannerProps {
  trialEndsAt: string;
  planName: string;
  onAddPaymentMethod?: () => void;
}

function useCountdown(targetIso: string) {
  const target = useMemo(() => new Date(targetIso).getTime(), [targetIso]);

  const calc = () => {
    const diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    return { d, h, m, s, diff };
  };

  const [state, setState] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setState(calc()), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return state;
}

const Digit = ({ value, label }: { value: number; label: string }) => (
  <div className='flex flex-col items-center'>
    <motion.div
      key={value}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className='min-w-[2ch] text-center font-mono text-sm font-bold tabular-nums text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
    >
      {String(value).padStart(2, '0')}
    </motion.div>
    <span className='text-[8px] font-medium uppercase tracking-widest text-white/70'>{label}</span>
  </div>
);

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: (i * 41 + 7) % 100,
  delay: (i * 0.3) % 2,
  dur: 3 + (i % 3),
}));

const TrialingBanner = ({ trialEndsAt, planName, onAddPaymentMethod }: TrialingBannerProps) => {
  const { d, h, m, s, diff } = useCountdown(trialEndsAt);
  const isUrgent = diff < 3 * 86_400_000; // < 3 days

  return (
    <AnimatePresence>
      {diff > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className='relative overflow-hidden'
        >
          {/* Animated gradient background */}
          <motion.div
            className='absolute inset-0'
            style={{
              background: isUrgent
                ? 'linear-gradient(135deg, hsl(25 95% 50%), hsl(0 84% 55%), hsl(340 80% 50%), hsl(25 95% 50%))'
                : 'linear-gradient(135deg, hsl(217 91% 55%), hsl(270 70% 58%), hsl(174 72% 45%), hsl(217 91% 55%))',
              backgroundSize: '300% 300%',
            }}
            animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />

          {/* Shimmer sweep */}
          <motion.div
            className='absolute inset-0 pointer-events-none'
            style={{
              background:
                'linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.2) 50%, transparent 75%)',
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
          />

          {/* Floating particles */}
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className='absolute w-1 h-1 rounded-full bg-white/60 pointer-events-none'
              style={{ left: `${p.x}%`, bottom: 0 }}
              animate={{ y: [0, -40], opacity: [0, 0.8, 0] }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ))}

          <div className='relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:flex-nowrap sm:px-6'>
            <div className='flex items-center gap-2.5'>
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className='h-4 w-4 shrink-0 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]' />
              </motion.div>
              <p className='text-xs font-semibold text-white sm:text-sm'>
                <span className='opacity-90'>Free trial active — </span>
                <strong>{planName}</strong>
                <span className='opacity-90'> plan. Add a card to keep access after trial ends.</span>
              </p>
            </div>

            <div className='flex items-center gap-3'>
              {/* Countdown */}
              <div className='flex items-center gap-1.5 rounded-xl bg-black/20 px-3 py-1.5 backdrop-blur-sm'>
                <Clock className='h-3 w-3 text-white/80' />
                <div className='flex items-center gap-1'>
                  <Digit value={d} label='d' />
                  <span className='mb-2 text-xs font-bold text-white/70'>:</span>
                  <Digit value={h} label='h' />
                  <span className='mb-2 text-xs font-bold text-white/70'>:</span>
                  <Digit value={m} label='m' />
                  <span className='mb-2 text-xs font-bold text-white/70'>:</span>
                  <Digit value={s} label='s' />
                </div>
              </div>

              {onAddPaymentMethod && (
                <Button
                  size='sm'
                  onClick={onAddPaymentMethod}
                  className='h-7 gap-1.5 bg-white/20 px-3 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/35 border-white/30 border'
                  variant='outline'
                >
                  <Zap className='h-3 w-3' />
                  <span className='hidden sm:inline'>Add Card</span>
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TrialingBanner;
