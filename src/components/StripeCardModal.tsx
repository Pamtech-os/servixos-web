'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock, ArrowRight, Loader2, X } from 'lucide-react';
import { useTheme } from 'next-themes';

// ─── Stripe init ──────────────────────────────────────────────────────────────

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ?? ''
);

// ─── Stripe element style helpers ────────────────────────────────────────────

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
    classes: {
      base: 'stripe-element',
      focus: 'stripe-element-focus',
    },
  };
}

// ─── Shared field wrapper ─────────────────────────────────────────────────────

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

// ─── Inner form ───────────────────────────────────────────────────────────────

interface InnerFormProps {
  mode: 'setup' | 'payment';
  clientSecret: string;
  amountCents?: number;
  currency?: string;
  onSuccess: (paymentMethodId?: string) => void;
  onClose: () => void;
}

const InnerForm = ({
  mode,
  clientSecret,
  amountCents,
  currency = 'usd',
  onSuccess,
  onClose,
}: InnerFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const stripeStyle = useStripeElementStyle();

  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const formattedAmount =
    amountCents != null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          minimumFractionDigits: 2,
        }).format(amountCents / 100)
      : null;

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
        if (mode === 'setup') {
          const { error: stripeErr, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
            payment_method: { card: cardNumber },
          });
          if (stripeErr) {
            setError(stripeErr.message ?? 'Card setup failed. Please try again.');
          } else {
            onSuccess(
              typeof setupIntent.payment_method === 'string'
                ? setupIntent.payment_method
                : (setupIntent.payment_method?.id ?? undefined)
            );
          }
        } else {
          const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(
            clientSecret,
            { payment_method: { card: cardNumber } }
          );
          if (stripeErr) {
            setError(stripeErr.message ?? 'Payment failed. Please try again.');
          } else if (paymentIntent.status === 'succeeded') {
            onSuccess();
          }
        }
      } finally {
        setIsPending(false);
      }
    },
    [stripe, elements, mode, clientSecret, onSuccess]
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

      <div className='flex flex-col-reverse gap-2.5 pt-1 sm:flex-row'>
        <Button
          type='button'
          variant='outline'
          onClick={onClose}
          disabled={isPending}
          className='sm:flex-1'
        >
          Cancel
        </Button>
        <Button
          type='submit'
          disabled={isPending || !stripe}
          className='relative overflow-hidden sm:flex-1 gradient-bg border-0 text-white shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-300 glow-shadow'
        >
          <span className='relative z-10 flex items-center justify-center gap-2 font-semibold'>
            {isPending ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <CreditCard className='h-4 w-4' />
            )}
            {isPending
              ? 'Processing...'
              : mode === 'payment' && formattedAmount
              ? `Pay ${formattedAmount}`
              : 'Save card'}
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
      </div>

      <div className='flex items-center justify-center gap-1.5 text-xs text-muted-foreground'>
        <Lock className='h-3 w-3' />
        Secured by Stripe — your card details are never stored on our servers.
      </div>
    </form>
  );
};

// ─── Modal shell ──────────────────────────────────────────────────────────────

export interface StripeCardModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'setup' | 'payment';
  clientSecret: string;
  amountCents?: number;
  currency?: string;
  onSuccess: (paymentMethodId?: string) => void;
}

const StripeCardModal = ({
  open,
  onClose,
  mode,
  clientSecret,
  amountCents,
  currency,
  onSuccess,
}: StripeCardModalProps) => {
  const elementsOptions: StripeElementsOptions = {
    clientSecret,
    appearance: { theme: 'none' as unknown as 'stripe' },
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='overflow-hidden border-0 bg-transparent p-0 shadow-none max-w-[440px] [&>button]:hidden'>
        <DialogTitle className='sr-only'>
          {mode === 'setup' ? 'Add payment method' : 'Complete payment'}
        </DialogTitle>
        <DialogDescription className='sr-only'>
          {mode === 'setup'
            ? 'Securely save your card to activate your subscription.'
            : 'Confirm payment to restore your account access.'}
        </DialogDescription>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className='relative rounded-3xl border border-border/50 bg-card card-shadow-hover'
            >
              {/* Header gradient strip */}
              <div className='relative overflow-hidden rounded-t-3xl px-7 pb-5 pt-6'>
                <motion.div
                  className='absolute inset-0 opacity-10'
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(217 91% 60%), hsl(270 70% 60%), hsl(174 72% 50%))',
                    backgroundSize: '300% 300%',
                  }}
                  animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                />

                <button
                  onClick={onClose}
                  className='absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-background/60 text-muted-foreground backdrop-blur-md transition-all hover:scale-110 hover:bg-background/90 hover:text-foreground'
                  aria-label='Close'
                >
                  <X className='h-4 w-4' />
                </button>

                <div className='relative'>
                  <div className='mb-1 flex items-center gap-2'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-xl gradient-bg'>
                      <CreditCard className='h-4 w-4 text-white' />
                    </div>
                    <span className='text-xs font-semibold text-primary'>
                      {mode === 'setup' ? 'Add card' : 'Pay now'}
                    </span>
                  </div>
                  <h2 className='text-xl font-bold tracking-tight'>
                    {mode === 'setup' ? 'Save your payment method' : 'Complete your payment'}
                  </h2>
                  {amountCents != null && mode === 'payment' && (
                    <p className='mt-1 text-sm text-muted-foreground'>
                      Amount due:{' '}
                      <strong className='text-foreground'>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: currency ?? 'usd',
                          minimumFractionDigits: 2,
                        }).format(amountCents / 100)}
                      </strong>
                    </p>
                  )}
                </div>
              </div>

              <div className='px-7 pb-7'>
                {clientSecret && (
                  <Elements stripe={stripePromise} options={elementsOptions}>
                    <InnerForm
                      mode={mode}
                      clientSecret={clientSecret}
                      amountCents={amountCents}
                      currency={currency}
                      onSuccess={onSuccess}
                      onClose={onClose}
                    />
                  </Elements>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default StripeCardModal;
