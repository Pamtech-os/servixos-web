'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Lock, Zap, Crown, Check, ArrowRight, X } from 'lucide-react';

export interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  currentPlan?: string;
  requiredPlan?: string;
  benefits?: string[];
  onUpgrade?: () => void;
  onLater?: () => void;
}

const DEFAULT_BENEFITS = [
  'Unlock all premium features',
  'Priority support, 24/7',
  'Advanced analytics & reports',
  'Unlimited team members',
];

const UpgradePlanModal = ({
  open,
  onOpenChange,
  featureName = 'this feature',
  currentPlan = 'Free',
  requiredPlan = 'Pro',
  benefits = DEFAULT_BENEFITS,
  onUpgrade,
  onLater,
}: UpgradePlanModalProps) => {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        x: ((i * 37 + 13) % 100),
        y: ((i * 53 + 7) % 100),
        size: 2 + (i % 3) * 2,
        delay: (i % 5) * 0.4,
        duration: 4 + (i % 4),
      })),
    []
  );

  const orbits = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        angle: (360 / 6) * i,
        delay: i * 0.15,
      })),
    []
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden border-0 max-w-[480px] bg-transparent shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">Upgrade required</DialogTitle>
        <DialogDescription className="sr-only">
          Upgrade your plan to unlock {featureName}.
        </DialogDescription>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="relative rounded-3xl overflow-hidden bg-card border border-border/50 card-shadow-hover"
            >
              {/* Close button */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full flex items-center justify-center bg-background/60 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background/90 transition-all hover:scale-110"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Hero */}
              <div className="relative h-56 overflow-hidden">
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(217 91% 60%), hsl(270 70% 60%), hsl(174 72% 50%), hsl(217 91% 60%))',
                    backgroundSize: '300% 300%',
                  }}
                  animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />

                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 40%, transparent 0%, hsl(220 25% 8% / 0.35) 100%)',
                  }}
                />

                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-white/70"
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      width: p.size,
                      height: p.size,
                      filter: 'blur(0.5px)',
                    }}
                    animate={{ y: [0, -30, 0], opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                    transition={{
                      duration: p.duration,
                      delay: p.delay,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                ))}

                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="relative w-44 h-44"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                  >
                    {orbits.map((o) => (
                      <motion.div
                        key={o.id}
                        className="absolute top-1/2 left-1/2 w-2 h-2"
                        style={{ transform: `rotate(${o.angle}deg) translateY(-80px)` }}
                        animate={{ scale: [0.5, 1.4, 0.5], opacity: [0.4, 1, 0.4] }}
                        transition={{
                          duration: 2,
                          delay: o.delay,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        <Sparkles className="w-3 h-3 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="relative"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12, delay: 0.15 }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)',
                        filter: 'blur(20px)',
                      }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.9, 0.5] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    <div className="relative w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Lock className="w-10 h-10 text-white drop-shadow-lg" />
                      </motion.div>

                      <motion.div
                        className="absolute -top-3 -right-3 w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center shadow-lg"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.6, type: 'spring', damping: 10 }}
                      >
                        <Crown className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
                  }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                />
              </div>

              {/* Content */}
              <div className="relative px-7 pt-6 pb-7 bg-card">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-center gap-2 mb-3"
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    <Zap className="w-3 h-3" />
                    {currentPlan} → {requiredPlan}
                  </span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold tracking-tight mb-2"
                >
                  Unlock <span className="gradient-text">{featureName}</span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-sm text-muted-foreground leading-relaxed mb-5"
                >
                  This feature is part of the{' '}
                  <strong className="text-foreground">{requiredPlan}</strong> plan. Upgrade now to
                  unlock its full power — and a lot more.
                </motion.p>

                <motion.ul
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.07, delayChildren: 0.4 } },
                  }}
                  className="space-y-2.5 mb-6"
                >
                  {benefits.map((b, i) => (
                    <motion.li
                      key={i}
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        show: { opacity: 1, x: 0 },
                      }}
                      className="flex items-start gap-3 text-sm"
                    >
                      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full gradient-bg flex items-center justify-center shadow-sm">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                      <span className="text-foreground/90">{b}</span>
                    </motion.li>
                  ))}
                </motion.ul>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col-reverse sm:flex-row gap-2.5"
                >
                  <Button
                    variant="ghost"
                    onClick={() => {
                      onLater?.();
                      onOpenChange(false);
                    }}
                    className="sm:flex-1"
                  >
                    Maybe later
                  </Button>

                  <Button
                    onClick={() => onUpgrade?.()}
                    className="sm:flex-1 relative overflow-hidden group gradient-bg text-white border-0 hover:opacity-100 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl glow-shadow"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2 font-semibold">
                      Upgrade to {requiredPlan}
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.span>
                    </span>
                    <motion.span
                      className="absolute inset-0 pointer-events-none"
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

export default UpgradePlanModal;
