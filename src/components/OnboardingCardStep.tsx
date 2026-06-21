'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock, Loader2, ArrowRight, ShieldCheck, Calendar } from 'lucide-react';
import { useTheme } from 'next-themes';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ?? '');

function useStripeElementStyle() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return {
    style: {
      base: {
        fontSize: '14px',
        fontFamily: 'inherit',
        color: isDark ? '#f1f5f9' : '#0f172a',
        '::placeholder': { color: isDark ? '#64748b' : '#94a3b8' },
        iconColor: isDark ? '#94a3b8' : '#64748b',
      },
      invalid: { color: '#ef4444', iconColor: '#ef4444' },
    },
    classes: { base: 'stripe-element', focus: 'stripe-element-focus' },
  };
}

const StripeField = ({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) => (
  <div className='space-y-1.5'>
    <label className='text-xs font-medium text-muted-foreground'>{label}</label>
    <div
      className={`rounded-xl border px-3 py-3 transition-colors ${
        error
          ? 'border-destructive/50 bg-destructive/5'
          : 'border-border bg-muted/40 focus-within:border-primary/60 focus-within:bg-transparent'
      }`}
    >
      {children}
    </div>
    {error && <p className='text-xs text-destructive'>{error}</p>}
  </div>
);

const CardForm = ({
  clientSecret,
  onSuccess,
}: {
  clientSecret: string;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const stripeStyle = useStripeElementStyle();
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;
      setError('');
      setIsPending(true);

      const cardNumber = elements.getElement(CardNumberElement);
      if (!cardNumber) {
        setIsPending(false);
        return;
      }

      try {
        const { error: stripeErr } = await stripe.confirmCardSetup(clientSecret, {
          payment_method: { card: cardNumber },
        });
        if (stripeErr) {
          setError(stripeErr.message ?? 'Card setup failed. Please try again.');
        } else {
          onSuccess();
        }
      } finally {
        setIsPending(false);
      }
    },
    [stripe, elements, clientSecret, onSuccess]
  );

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className='space-y-4'>
      <StripeField label='Card number'>
        <CardNumberElement options={stripeStyle} />
      </StripeField>

      <div className='grid grid-cols-2 gap-3'>
        <StripeField label='Expiry date'>
          <CardExpiryElement options={stripeStyle} />
        </StripeField>
        <StripeField label='CVC'>
          <CardCvcElement options={stripeStyle} />
        </StripeField>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive'
        >
          {error}
        </motion.p>
      )}

      <Button
        type='submit'
        disabled={isPending || !stripe}
        className='relative w-full overflow-hidden border-0 gradient-bg text-white shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-300 glow-shadow h-11'
      >
        <span className='relative z-10 flex items-center justify-center gap-2 font-semibold'>
          {isPending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <CreditCard className='h-4 w-4' />
          )}
          {isPending ? 'Saving card...' : 'Save card & continue'}
          {!isPending && (
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowRight className='h-4 w-4' />
            </motion.span>
          )}
        </span>
        {!isPending && (
          <motion.span
            className='absolute inset-0 pointer-events-none'
            style={{
              background:
                'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.8 }}
          />
        )}
      </Button>

      <div className='flex items-center justify-center gap-1.5 text-xs text-muted-foreground'>
        <Lock className='h-3 w-3' />
        Secured by Stripe — your card details are never stored on our servers.
      </div>
    </form>
  );
};

export interface OnboardingCardStepProps {
  clientSecret: string;
  onSuccess: () => void;
}

const OnboardingCardStep = ({ clientSecret, onSuccess }: OnboardingCardStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className='space-y-5'
    >
      <div className='rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 space-y-1'>
        <div className='flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400'>
          <Calendar className='h-4 w-4' />
          No charge today
        </div>
        <p className='text-xs text-muted-foreground'>
          Your card will only be charged once your free trial ends. Cancel anytime before then and
          you won&apos;t be charged.
        </p>
      </div>

      <div className='rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 space-y-1'>
        <div className='flex items-center gap-2 text-sm font-semibold text-primary'>
          <ShieldCheck className='h-4 w-4' />
          Why we collect this now
        </div>
        <p className='text-xs text-muted-foreground'>
          Saving your card ensures uninterrupted service when your trial ends — no manual renewals
          needed.
        </p>
      </div>

      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'none' as unknown as 'stripe' } }}>
        <CardForm clientSecret={clientSecret} onSuccess={onSuccess} />
      </Elements>
    </motion.div>
  );
};

export default OnboardingCardStep;
