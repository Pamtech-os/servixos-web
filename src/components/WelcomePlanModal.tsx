'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Check, Rocket, Star } from 'lucide-react';

export interface WelcomePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName?: string;
  features?: string[];
}

const DEFAULT_FEATURES = [
  'Full access to all platform features',
  'Priority customer support',
  'Advanced analytics & AI insights',
  'Unlimited team collaboration',
];

const CONFETTI_COLORS = [
  'bg-yellow-400',
  'bg-pink-400',
  'bg-blue-400',
  'bg-green-400',
  'bg-purple-400',
  'bg-orange-400',
  'bg-cyan-400',
  'bg-rose-400',
];

const WelcomePlanModal = ({
  open,
  onOpenChange,
  planName = 'Starter',
  features = DEFAULT_FEATURES,
}: WelcomePlanModalProps) => {
  const confetti = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: (i * 37 + 11) % 100,
        y: (i * 53 + 5) % 60,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 4 + (i % 4) * 2,
        delay: (i * 0.08) % 1.6,
        dur: 2.5 + (i % 4) * 0.5,
        rotate: (i * 47) % 360,
      })),
    []
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        angle: (360 / 8) * i,
        delay: i * 0.12,
      })),
    []
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='overflow-hidden border-0 bg-transparent p-0 shadow-none max-w-[500px] [&>button]:hidden'>
        <DialogTitle className='sr-only'>Welcome to {planName}</DialogTitle>
        <DialogDescription className='sr-only'>
          Your {planName} subscription is now active. Enjoy full access.
        </DialogDescription>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 260 }}
              className='relative overflow-hidden rounded-3xl border border-border/50 bg-card card-shadow-hover'
            >
              {/* Hero */}
              <div className='relative h-60 overflow-hidden'>
                {/* Animated gradient */}
                <motion.div
                  className='absolute inset-0'
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(38 92% 50%), hsl(280 70% 58%), hsl(217 91% 58%), hsl(174 72% 46%), hsl(38 92% 50%))',
                    backgroundSize: '400% 400%',
                  }}
                  animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                />

                <div
                  className='absolute inset-0'
                  style={{
                    background:
                      'radial-gradient(circle at 50% 40%, transparent 0%, hsl(220 25% 8% / 0.3) 100%)',
                  }}
                />

                {/* Confetti */}
                {confetti.map((c) => (
                  <motion.div
                    key={c.id}
                    className={`absolute rounded-sm ${c.color}`}
                    style={{
                      left: `${c.x}%`,
                      top: `-${c.size}px`,
                      width: c.size,
                      height: c.size,
                      rotate: c.rotate,
                    }}
                    animate={{
                      y: ['0%', '400%'],
                      rotate: [c.rotate, c.rotate + 360 * 2],
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: c.dur,
                      delay: c.delay,
                      repeat: Infinity,
                      ease: 'easeIn',
                    }}
                  />
                ))}

                {/* Orbiting stars */}
                <div className='absolute inset-0 flex items-center justify-center'>
                  <motion.div
                    className='relative w-48 h-48'
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  >
                    {stars.map((s) => (
                      <motion.div
                        key={s.id}
                        className='absolute top-1/2 left-1/2 w-2 h-2'
                        style={{ transform: `rotate(${s.angle}deg) translateY(-88px)` }}
                        animate={{ scale: [0.5, 1.6, 0.5], opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.8,
                          delay: s.delay,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        <Star className='w-3 h-3 fill-white text-white drop-shadow-[0_0_6px_rgba(255,255,255,1)]' />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Center icon */}
                <div className='absolute inset-0 flex items-center justify-center'>
                  <motion.div
                    className='relative'
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 10, delay: 0.1 }}
                  >
                    <motion.div
                      className='absolute inset-0 rounded-full'
                      style={{
                        background:
                          'radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 70%)',
                        filter: 'blur(24px)',
                      }}
                      animate={{ scale: [1, 1.6, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className='relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/30 bg-white/15 shadow-2xl backdrop-blur-md'>
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Rocket className='h-11 w-11 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]' />
                      </motion.div>
                      <motion.div
                        className='absolute -top-3 -right-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg'
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.5, type: 'spring', damping: 10 }}
                      >
                        <Crown className='h-5 w-5 text-white' />
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                {/* Shimmer sweep */}
                <motion.div
                  className='absolute inset-0 pointer-events-none'
                  style={{
                    background:
                      'linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.3) 50%, transparent 75%)',
                  }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    repeatDelay: 1,
                  }}
                />
              </div>

              {/* Body */}
              <div className='relative bg-card px-7 pb-7 pt-6'>
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className='mb-3 flex items-center gap-2'
                >
                  <span className='inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary'>
                    <Sparkles className='h-3 w-3' />
                    You&apos;re all set
                  </span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.26 }}
                  className='mb-2 text-2xl font-bold tracking-tight'
                >
                  Welcome to{' '}
                  <span className='gradient-text'>{planName}</span>!
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 }}
                  className='mb-5 text-sm leading-relaxed text-muted-foreground'
                >
                  Your subscription is now{' '}
                  <strong className='text-emerald-500'>active</strong>. Everything is unlocked —
                  let&apos;s build something great.
                </motion.p>

                <motion.ul
                  initial='hidden'
                  animate='show'
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.07, delayChildren: 0.38 } },
                  }}
                  className='mb-6 space-y-2.5'
                >
                  {features.map((f, i) => (
                    <motion.li
                      key={i}
                      variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                      className='flex items-start gap-3 text-sm'
                    >
                      <span className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15'>
                        <Check className='h-3 w-3 text-emerald-500' strokeWidth={3} />
                      </span>
                      <span className='text-foreground/90'>{f}</span>
                    </motion.li>
                  ))}
                </motion.ul>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    onClick={() => onOpenChange(false)}
                    className='relative w-full overflow-hidden border-0 gradient-bg text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl glow-shadow h-11'
                  >
                    <span className='relative z-10 flex items-center justify-center gap-2 font-semibold'>
                      <Rocket className='h-4 w-4' />
                      Start exploring
                    </span>
                    <motion.span
                      className='absolute inset-0 pointer-events-none'
                      style={{
                        background:
                          'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                      }}
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        repeatDelay: 0.8,
                      }}
                    />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePlanModal;
