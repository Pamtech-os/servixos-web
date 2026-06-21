'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Clock,
  CreditCard,
  ArrowRight,
  X,
  Calendar,
  Receipt,
  Zap,
} from 'lucide-react';

export interface GracePeriodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName?: string;
  billingCycle?: 'Monthly' | 'Yearly' | string;
  renewalAmount?: number;
  currency?: string;
  daysRemaining?: number;
  dueDate?: string;
  onPayNow?: () => void;
  onCancel?: () => void;
}

const GracePeriodModal = ({
  open,
  onOpenChange,
  planName = 'Pro',
  billingCycle = 'Monthly',
  renewalAmount = 49,
  currency = 'USD',
  daysRemaining = 7,
  dueDate,
  onPayNow,
  onCancel,
}: GracePeriodModalProps) => {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 5,
        delay: Math.random() * 2,
        duration: 4 + Math.random() * 4,
      })),
    [],
  );

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(renewalAmount);

  const progress = Math.max(0, Math.min(100, (daysRemaining / 5) * 100));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='p-0 overflow-hidden border-0 max-w-[480px] bg-transparent shadow-none [&>button]:hidden'
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className='sr-only'>Subscription grace period</DialogTitle>
        <DialogDescription className='sr-only'>
          Your {planName} subscription payment is overdue. {daysRemaining} days
          left in grace period.
        </DialogDescription>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className='relative rounded-3xl overflow-hidden bg-card border border-border/50 card-shadow-hover'
            >
              <button
                onClick={() => onOpenChange(false)}
                className='absolute top-4 right-4 z-30 w-8 h-8 rounded-full flex items-center justify-center bg-background/60 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background/90 transition-all hover:scale-110'
                aria-label='Close'
              >
                <X className='w-4 h-4' />
              </button>

              <div className='relative h-48 overflow-hidden'>
                <motion.div
                  className='absolute inset-0'
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(38 92% 50%), hsl(25 95% 55%), hsl(0 84% 60%), hsl(38 92% 50%))',
                    backgroundSize: '300% 300%',
                  }}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                <div
                  className='absolute inset-0'
                  style={{
                    background:
                      'radial-gradient(circle at 50% 40%, transparent 0%, hsl(220 25% 8% / 0.35) 100%)',
                  }}
                />
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    className='absolute rounded-full bg-white/70'
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      width: p.size,
                      height: p.size,
                      filter: 'blur(0.5px)',
                    }}
                    animate={{
                      y: [0, -30, 0],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1.2, 0.5],
                    }}
                    transition={{
                      duration: p.duration,
                      delay: p.delay,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                ))}

                <div className='absolute inset-0 flex items-center justify-center'>
                  <motion.div
                    className='relative'
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12, delay: 0.15 }}
                  >
                    <motion.div
                      className='absolute inset-0 rounded-full'
                      style={{
                        background:
                          'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)',
                        filter: 'blur(20px)',
                      }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.9, 0.5] }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <div className='relative w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl'>
                      <motion.div
                        animate={{ rotate: [0, -8, 8, 0] }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        <Clock className='w-10 h-10 text-white drop-shadow-lg' />
                      </motion.div>
                      <motion.div
                        className='absolute -top-3 -right-3 w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-lg'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6, type: 'spring', damping: 10 }}
                      >
                        <AlertTriangle className='w-5 h-5 text-amber-500' />
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  className='absolute inset-0 pointer-events-none'
                  style={{
                    background:
                      'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
                  }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    repeatDelay: 1.5,
                  }}
                />
              </div>

              <div className='relative px-7 pt-6 pb-7 bg-card'>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className='flex items-center gap-2 mb-3'
                >
                  <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-sm'>
                    <Clock className='w-3 h-3' />
                    Grace period • {daysRemaining} day
                    {daysRemaining === 1 ? '' : 's'} left
                  </span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className='text-2xl font-bold tracking-tight mb-2'
                >
                  Your payment is{' '}
                  <span className='bg-gradient-to-r from-amber-500 to-red-500 bg-clip-text text-transparent'>
                    overdue
                  </span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className='text-sm text-muted-foreground leading-relaxed mb-5'
                >
                  We couldn&apos;t renew your{' '}
                  <strong className='text-foreground'>{planName}</strong>{' '}
                  subscription. Pay within{' '}
                  <strong className='text-foreground'>
                    {daysRemaining} day{daysRemaining === 1 ? '' : 's'}
                  </strong>{' '}
                  to keep your access uninterrupted.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className='mb-5'
                >
                  <div className='flex items-center justify-between text-xs text-muted-foreground mb-1.5'>
                    <span>Grace period</span>
                    <span className='font-semibold text-foreground'>
                      {daysRemaining} of 5 days
                    </span>
                  </div>
                  <div className='h-2 rounded-full bg-muted overflow-hidden'>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{
                        delay: 0.5,
                        duration: 0.8,
                        ease: 'easeOut',
                      }}
                      className='h-full bg-gradient-to-r from-amber-400 to-red-500 rounded-full'
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className='rounded-2xl border border-border/60 bg-muted/40 p-4 mb-6 space-y-2.5'
                >
                  <div className='flex items-center justify-between text-sm'>
                    <span className='flex items-center gap-2 text-muted-foreground'>
                      <Zap className='w-4 h-4' /> Plan
                    </span>
                    <span className='font-semibold text-foreground'>
                      {planName}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='flex items-center gap-2 text-muted-foreground'>
                      <Calendar className='w-4 h-4' /> Billing
                    </span>
                    <span className='font-semibold text-foreground'>
                      {billingCycle}
                    </span>
                  </div>
                  {dueDate && (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='flex items-center gap-2 text-muted-foreground'>
                        <Clock className='w-4 h-4' /> Due
                      </span>
                      <span className='font-semibold text-foreground'>
                        {dueDate}
                      </span>
                    </div>
                  )}
                  <div className='h-px bg-border/60 my-1' />
                  <div className='flex items-center justify-between'>
                    <span className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Receipt className='w-4 h-4' /> Renewal amount
                    </span>
                    <span className='text-lg font-bold gradient-text'>
                      {formattedAmount}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className='flex flex-col-reverse sm:flex-row gap-2.5'
                >
                  <Button
                    variant='outline'
                    onClick={() => {
                      onCancel?.();
                      onOpenChange(false);
                    }}
                    className='sm:flex-1'
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={() => onPayNow?.()}
                    className='sm:flex-1 relative overflow-hidden group gradient-bg text-white border-0 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl glow-shadow'
                  >
                    <span className='relative z-10 flex items-center justify-center gap-2 font-semibold'>
                      <CreditCard className='w-4 h-4' />
                      Pay {formattedAmount} now
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{
                          duration: 1.4,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        <ArrowRight className='w-4 h-4' />
                      </motion.span>
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

export default GracePeriodModal;
