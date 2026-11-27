'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Image from 'next/image';
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
import { useTheme } from 'next-themes';
import {
  CalendarClock,
  Check,
  CreditCard,
  Gift,
  Loader2,
  Lock,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSubscriptionPlans, useTrialQuote } from '@/hooks/queries/use-subscription';
import { useSetupIntentMutation, useSubscribeMutation } from '@/hooks/mutations/use-subscription';
import { HttpError, getApiErrorMessage } from '@/common/network/http-client';
import type { BillingInterval, TrialQuote } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import servixLogo from '@/assets/servix-logo.png';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ?? '');

const DEFAULT_PLAN = 'starter';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function useStripeElementStyle() {
  const { resolvedTheme, forcedTheme } = useTheme();
  const isDark = (forcedTheme ?? resolvedTheme) === 'dark';
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

const StripeField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='space-y-1.5'>
    <span className='text-xs font-medium text-muted-foreground'>{label}</span>
    <div className='rounded-xl border border-border bg-muted/40 px-3 py-3 transition-colors focus-within:border-primary/60 focus-within:bg-transparent'>
      {children}
    </div>
  </div>
);

// ─── Terms ────────────────────────────────────────────────────────────────────

const QuoteSummary = ({ quote }: { quote: TrialQuote }) => (
  <div className='space-y-4'>
    <div className='rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4'>
      <div className='flex items-center gap-2 text-sm font-semibold text-emerald-500'>
        <Gift className='h-4 w-4' />
        Your first {quote.trialDays} days are free
      </div>
      <div className='mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1'>
        <span className='font-display text-2xl font-bold'>{quote.formattedAmount}</span>
        <span className='text-sm text-muted-foreground'>
          per {quote.billingInterval === 'yearly' ? 'year' : 'month'} after your trial
        </span>
      </div>
      <p className='mt-2 flex items-center gap-1.5 text-xs text-muted-foreground'>
        <CalendarClock className='h-3.5 w-3.5 shrink-0' />
        First charge on <span className='font-medium text-foreground'>{formatDate(quote.firstChargeAt)}</span>
      </p>
    </div>

    <ul className='space-y-2 text-xs text-muted-foreground'>
      {[quote.terms.trial, quote.terms.cancellation, quote.terms.reminder, quote.terms.tax].map(
        (line) => (
          <li key={line} className='flex gap-2'>
            <Check className='mt-0.5 h-3.5 w-3.5 shrink-0 text-primary' />
            <span>{line}</span>
          </li>
        )
      )}
    </ul>
  </div>
);

// ─── Card form ────────────────────────────────────────────────────────────────

interface CardFormProps {
  clientSecret: string;
  plan: string;
  billingInterval: BillingInterval;
  quote: TrialQuote | undefined;
  refetchQuote: () => Promise<{ data?: TrialQuote }>;
}

const CardForm = ({ clientSecret, plan, billingInterval, quote, refetchQuote }: CardFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const stripeStyle = useStripeElementStyle();
  const { refreshSubscription } = useSubscription();
  const subscribeMutation = useSubscribeMutation();

  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  // A SetupIntent can only be confirmed once, so keep the saved card if subscribe fails.
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);

  // A different plan or interval is a different quote: ask for consent again.
  useEffect(() => {
    setAccepted(false);
  }, [plan, billingInterval]);

  const isPending = isConfirming || subscribeMutation.isPending;
  const canSubmit = Boolean(stripe && quote && accepted) && !isPending;

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements || !quote || !accepted) return;
      setError('');

      let pmId = paymentMethodId;
      if (!pmId) {
        const card = elements.getElement(CardNumberElement);
        if (!card) return;
        setIsConfirming(true);
        try {
          const { error: stripeErr, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
            payment_method: { card },
          });
          if (stripeErr || !setupIntent?.payment_method) {
            setError(stripeErr?.message ?? 'Card setup failed. Please try again.');
            return;
          }
          pmId =
            typeof setupIntent.payment_method === 'string'
              ? setupIntent.payment_method
              : setupIntent.payment_method.id;
          setPaymentMethodId(pmId);
        } finally {
          setIsConfirming(false);
        }
      }

      try {
        await subscribeMutation.mutateAsync({
          plan,
          billingInterval,
          paymentMethodId: pmId,
          acceptTerms: true,
          termsVersion: quote.termsVersion,
        });
        toast.success('Your 7-day free trial has started!');
        await refreshSubscription();
      } catch (err) {
        if (!(err instanceof HttpError)) {
          setError(getApiErrorMessage(err));
          return;
        }
        if (err.status === 409) {
          await refreshSubscription();
          return;
        }
        if (err.status === 503) {
          setError('Payments are temporarily unavailable. Your card is saved — please try again shortly.');
          return;
        }
        if (err.status === 400) {
          const { data: latest } = await refetchQuote();
          if (latest && latest.termsVersion !== quote.termsVersion) {
            setAccepted(false);
            setError('Our terms have been updated. Please review them and accept again.');
            return;
          }
        }
        setError(getApiErrorMessage(err));
      }
    },
    [
      stripe,
      elements,
      quote,
      accepted,
      paymentMethodId,
      clientSecret,
      subscribeMutation,
      plan,
      billingInterval,
      refreshSubscription,
      refetchQuote,
    ]
  );

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className='space-y-4'>
      {paymentMethodId ? (
        <div className='flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-3 text-sm'>
          <CreditCard className='h-4 w-4 text-emerald-500' />
          Card saved
        </div>
      ) : (
        <>
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
        </>
      )}

      <div className='flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3'>
        <Checkbox
          id='accept-trial-terms'
          checked={accepted}
          onCheckedChange={(v) => setAccepted(v === true)}
          disabled={!quote || isPending}
          className='mt-0.5'
        />
        <Label htmlFor='accept-trial-terms' className='text-xs font-normal leading-relaxed'>
          I agree to the trial terms above. I understand my card will be charged{' '}
          {quote ? <strong>{quote.formattedAmount}</strong> : 'the plan price'} on{' '}
          {quote ? formatDate(quote.firstChargeAt) : 'the day my trial ends'} unless I cancel
          before then.
        </Label>
      </div>

      {error && (
        <p className='rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive'>
          {error}
        </p>
      )}

      <Button
        type='submit'
        disabled={!canSubmit}
        className='gradient-bg h-11 w-full border-0 font-semibold text-white'
      >
        {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <ShieldCheck className='h-4 w-4' />}
        {isPending ? 'Starting your trial…' : 'Start my 7-day free trial'}
      </Button>

      <p className='flex items-center justify-center gap-1.5 text-xs text-muted-foreground'>
        <Lock className='h-3 w-3' />
        Card details go straight to Stripe and never touch ServixOS.
      </p>
    </form>
  );
};

// ─── Step ─────────────────────────────────────────────────────────────────────

/**
 * Blocking step shown while the subscription is `incomplete`: the owner must add a card
 * and accept the trial terms before any business route will answer.
 */
const TrialPaymentStep = () => {
  const { auth, logout } = useAuth();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const quoteQuery = useTrialQuote(plan, billingInterval);
  const setupIntentMutation = useSetupIntentMutation();
  const [clientSecret, setClientSecret] = useState('');

  const sortedPlans = useMemo(
    () => [...(plans ?? [])].sort((a, b) => a.displayOrder - b.displayOrder),
    [plans]
  );
  const selectedPlan = sortedPlans.find((p) => p.slug === plan);

  const { mutate: createSetupIntent } = setupIntentMutation;
  const fetchSetupIntent = useCallback(() => {
    createSetupIntent(undefined, { onSuccess: (data) => setClientSecret(data.clientSecret) });
  }, [createSetupIntent]);

  useEffect(() => {
    fetchSetupIntent();
  }, [fetchSetupIntent]);

  return (
    <div className='min-h-dvh bg-background px-4 py-6 sm:py-10'>
      <div className='mx-auto flex max-w-5xl items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Image src={servixLogo} alt='Servix OS' width={32} height={32} className='h-8 w-8' />
          <span className='font-display font-bold'>Servix OS</span>
        </div>
        <Button variant='ghost' size='sm' onClick={logout}>
          <LogOut className='h-4 w-4' /> Sign out
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className='mx-auto mt-8 max-w-5xl space-y-2 text-center'
      >
        <h1 className='font-display text-2xl font-bold sm:text-3xl'>
          {auth.user?.firstName ? `${auth.user.firstName}, your` : 'Your'} Online Office is ready
        </h1>
        <p className='text-sm text-muted-foreground'>
          One last step: add a card to start your 7-day free trial. You won&apos;t be charged today.
        </p>
      </motion.div>

      <div className='mx-auto mt-8 grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_1fr]'>
        {/* Plan + terms */}
        <section className='space-y-5 rounded-2xl border border-border bg-card/80 p-4 sm:p-6'>
          <div className='flex items-center justify-between gap-3'>
            <h2 className='font-display text-lg font-semibold'>Choose your plan</h2>
            <div className='flex items-center gap-2 text-xs'>
              <span className={billingInterval === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}>
                Monthly
              </span>
              <Switch
                checked={billingInterval === 'yearly'}
                onCheckedChange={(v) => setBillingInterval(v ? 'yearly' : 'monthly')}
                aria-label='Bill yearly'
              />
              <span className={billingInterval === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}>
                Yearly
              </span>
            </div>
          </div>

          <div className='grid gap-2 sm:grid-cols-3'>
            {plansLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className='h-20 rounded-xl' />)
              : sortedPlans.map((p) => (
                  <button
                    key={p.slug}
                    type='button'
                    onClick={() => setPlan(p.slug)}
                    className={cn(
                      'rounded-xl border p-3 text-left transition-colors',
                      plan === p.slug
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className='flex items-center justify-between'>
                      <span className='font-semibold'>{p.name}</span>
                      {p.isPopular && (
                        <span className='rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary'>
                          Popular
                        </span>
                      )}
                    </div>
                    <p className='mt-1 line-clamp-2 text-xs text-muted-foreground'>{p.description}</p>
                  </button>
                ))}
          </div>

          {selectedPlan && selectedPlan.features.length > 0 && (
            <ul className='grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2'>
              {selectedPlan.features.slice(0, 8).map((f) => (
                <li key={f} className='flex gap-1.5'>
                  <Check className='mt-0.5 h-3 w-3 shrink-0 text-emerald-500' />
                  {f}
                </li>
              ))}
            </ul>
          )}

          {quoteQuery.isLoading ? (
            <Skeleton className='h-48 rounded-xl' />
          ) : quoteQuery.data ? (
            <QuoteSummary quote={quoteQuery.data} />
          ) : (
            <div className='space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive'>
              <p>{getApiErrorMessage(quoteQuery.error, 'We could not load pricing right now.')}</p>
              <Button size='sm' variant='outline' onClick={() => void quoteQuery.refetch()}>
                Try again
              </Button>
            </div>
          )}
        </section>

        {/* Card */}
        <section className='space-y-4 rounded-2xl border border-border bg-card/80 p-4 sm:p-6'>
          <h2 className='flex items-center gap-2 font-display text-lg font-semibold'>
            <CreditCard className='h-5 w-5 text-primary' /> Payment method
          </h2>
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CardForm
                clientSecret={clientSecret}
                plan={plan}
                billingInterval={billingInterval}
                quote={quoteQuery.data}
                refetchQuote={quoteQuery.refetch}
              />
            </Elements>
          ) : setupIntentMutation.isError ? (
            <div className='space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive'>
              <p>{getApiErrorMessage(setupIntentMutation.error)}</p>
              <Button size='sm' variant='outline' onClick={fetchSetupIntent}>
                Try again
              </Button>
            </div>
          ) : (
            <div className='space-y-3'>
              <Skeleton className='h-12 rounded-xl' />
              <div className='grid grid-cols-2 gap-3'>
                <Skeleton className='h-12 rounded-xl' />
                <Skeleton className='h-12 rounded-xl' />
              </div>
              <Skeleton className='h-11 rounded-xl' />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TrialPaymentStep;
