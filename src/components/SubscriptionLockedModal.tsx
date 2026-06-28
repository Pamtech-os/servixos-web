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
  Lock,
  CreditCard,
  ArrowRight,
  Calendar,
  Receipt,
  Zap,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

export interface SubscriptionLockedModalProps {
  open: boolean;
  planName?: string;
  billingCycle?: 'Monthly' | 'Yearly' | string;
  renewalAmount?: number;
  currency?: string;
  lockedSince?: string;
  fromTrial?: boolean;
  isPending?: boolean;
  onPayNow?: () => void;
}

const SubscriptionLockedModal = ({
  open,
  planName = 'Pro',
  billingCycle = 'Monthly',
  renewalAmount = 49,
  currency = 'USD',
  lockedSince,
  fromTrial = false,
  isPending = false,
  onPayNow,
}: SubscriptionLockedModalProps) => {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
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

  const handleOpenChange = () => {
    // non-closable modal
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className='p-0 overflow-hidden border-0 max-w-[480px] bg-transparent shadow-none [&>button]:hidden'
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className='sr-only'>Subscription locked</DialogTitle>
        <DialogDescription className='sr-only'>
          Your {planName} subscription is locked. Pay now to restore access.
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
              <div className='relative h-52 overflow-hidden'>
                <motion.div
                  className='absolute inset-0'
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(0 84% 60%), hsl(340 80% 55%), hsl(15 90% 50%), hsl(0 84% 60%))',
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
                      'radial-gradient(circle at 50% 40%, transparent 0%, hsl(220 25% 8% / 0.45) 100%)',
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
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className='absolute w-28 h-28 rounded-full border-2 border-white/30'
                      animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
                      transition={{
                        duration: 2.5,
                        delay: i * 0.6,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                </div>

                <div className='absolute inset-0 flex items-center justify-center'>
                  <motion.div
                    className='relative'
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12, delay: 0.15 }}
                  >
                    <motion.div
                      className='absolute inset-0 rounded-full'
                      style={{
                        background:
                          'radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 70%)',
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
                        animate={{
                          x: [0, -2, 2, -2, 2, 0],
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          repeatDelay: 2.5,
                          ease: 'easeInOut',
                        }}
                      >
                        <Lock className='w-10 h-10 text-white drop-shadow-lg' />
                      </motion.div>
                      <motion.div
                        className='absolute -top-3 -right-3 w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-lg'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6, type: 'spring', damping: 10 }}
                      >
                        <ShieldAlert className='w-5 h-5 text-red-500' />
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
                  <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20'>
                    <Lock className='w-3 h-3' />
                    Account locked
                  </span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className='text-2xl font-bold tracking-tight mb-2'
                >
                  Your access is{' '}
                  <span className='bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent'>
                    on hold
                  </span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className='text-sm text-muted-foreground leading-relaxed mb-5'
                >
                  {fromTrial ? (
                    <>
                      Your free trial has ended and we couldn&apos;t collect
                      your first payment. Pay now to activate your{' '}
                      <strong className='text-foreground'>{planName}</strong>{' '}
                      account.
                    </>
                  ) : (
                    <>
                      Your grace period has ended and your{' '}
                      <strong className='text-foreground'>{planName}</strong>{' '}
                      subscription is now locked. Settle the outstanding balance
                      to instantly restore access to your office.
                    </>
                  )}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className='rounded-2xl border border-destructive/30 bg-destructive/5 p-4 mb-6 space-y-2.5'
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
                  {lockedSince && (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='flex items-center gap-2 text-muted-foreground'>
                        <Lock className='w-4 h-4' /> Locked since
                      </span>
                      <span className='font-semibold text-foreground'>
                        {lockedSince}
                      </span>
                    </div>
                  )}
                  <div className='h-px bg-destructive/20 my-1' />
                  <div className='flex items-center justify-between'>
                    <span className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Receipt className='w-4 h-4' /> Amount due
                    </span>
                    <span className='text-lg font-bold text-destructive'>
                      {formattedAmount}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <Button
                    onClick={() => onPayNow?.()}
                    disabled={isPending}
                    className='w-full relative overflow-hidden group gradient-bg text-white border-0 hover:scale-[1.01] transition-all duration-300 shadow-lg hover:shadow-xl glow-shadow h-11 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100'
                  >
                    <span className='relative z-10 flex items-center justify-center gap-2 font-semibold'>
                      {isPending ? (
                        <Loader2 className='w-4 h-4 animate-spin' />
                      ) : (
                        <CreditCard className='w-4 h-4' />
                      )}
                      {isPending ? 'Preparing payment...' : `Pay ${formattedAmount} to restore access`}
                      {!isPending && (
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
                      )}
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

                  <p className='mt-3 text-center text-xs text-muted-foreground'>
                    Need help? Contact support - your data is safe and waiting.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionLockedModal;
