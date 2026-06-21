'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Sparkles,
  Crown,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Receipt,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSubscriptionPlans, useSubscriptionTransactions } from '@/hooks/queries/use-subscription';
import { useUpgradePlanMutation, useSetupIntentMutation, useSubscribeMutation } from '@/hooks/mutations/use-subscription';
import { useSubscription } from '@/contexts/SubscriptionContext';
import StripeCardModal from '@/components/StripeCardModal';
import type { SubscriptionPlan, BillingInterval } from '@/lib/api-client';
import { getApiErrorMessage } from '@/common/network/http-client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function centsToDisplay(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function planOrder(slug: string): number {
  return { starter: 0, growth: 1, pro: 2 }[slug] ?? 99;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    trialing:     { label: 'Trial',       className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    active:       { label: 'Active',      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    grace_period: { label: 'Grace',       className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    locked:       { label: 'Locked',      className: 'bg-destructive/10 text-destructive border-destructive/20' },
    canceled:     { label: 'Cancelled',   className: 'bg-muted text-muted-foreground border-border' },
  };
  const { label, className } = map[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}>{label}</span>;
}

function txStatusIcon(status: string) {
  if (status === 'success') return <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' />;
  if (status === 'failed')  return <XCircle className='h-3.5 w-3.5 text-destructive' />;
  return <Clock className='h-3.5 w-3.5 text-muted-foreground' />;
}

// ─── Plan card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: SubscriptionPlan;
  isYearly: boolean;
  currentPlanSlug: string | null;
  currentStatus: string | null;
  onAction: (plan: SubscriptionPlan, interval: BillingInterval) => void;
  isActing: boolean;
  actingSlug: string | null;
  index: number;
}

const PlanCard = ({
  plan,
  isYearly,
  currentPlanSlug,
  currentStatus,
  onAction,
  isActing,
  actingSlug,
  index,
}: PlanCardProps) => {
  const isCurrent = plan.slug === currentPlanSlug;
  const isDowngrade = currentPlanSlug ? planOrder(plan.slug) < planOrder(currentPlanSlug) : false;
  const hasActiveSubscription = currentStatus && !['canceled', null].includes(currentStatus);
  const interval = isYearly ? 'yearly' : 'monthly';
  const isPending = isActing && actingSlug === plan.slug;

  const displayPrice = isYearly
    ? `${centsToDisplay(Math.round(plan.yearlyPriceUsd / 12))}/mo`
    : `${centsToDisplay(plan.monthlyPriceUsd)}/mo`;
  const billingNote = isYearly
    ? `Billed ${centsToDisplay(plan.yearlyPriceUsd)}/year`
    : 'Billed monthly';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className='h-full'
    >
      <Card
        className={`relative flex h-full flex-col overflow-hidden transition-all ${
          plan.isPopular
            ? 'border-primary/50 shadow-[0_0_30px_-8px_hsl(var(--primary)/0.3)]'
            : 'border-border'
        } ${isCurrent ? 'ring-2 ring-emerald-500/50' : ''}`}
      >
        {plan.isPopular && (
          <div className='absolute left-0 right-0 top-0 bg-gradient-to-r from-primary to-secondary py-1 text-center'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-primary-foreground'>
              Most Popular
            </span>
          </div>
        )}

        <CardContent
          className={`flex flex-1 flex-col p-5 lg:p-6 ${plan.isPopular ? 'pt-10 lg:pt-10' : ''}`}
        >
          <div className='flex-1 space-y-4'>
            <div className='flex items-start justify-between gap-2'>
              <div>
                <h3 className='text-lg font-bold font-display'>{plan.name}</h3>
                <p className='mt-1 text-xs leading-relaxed text-muted-foreground'>
                  {plan.description}
                </p>
              </div>
              {isCurrent && currentStatus && statusBadge(currentStatus)}
            </div>

            <div>
              <div className='flex items-baseline gap-1'>
                <span
                  className={`font-display text-3xl font-bold lg:text-4xl ${
                    plan.isPopular ? 'text-primary' : ''
                  }`}
                >
                  {displayPrice}
                </span>
              </div>
              <p className='mt-0.5 text-xs text-muted-foreground'>{billingNote}</p>
              {isYearly && (
                <p className='mt-1 text-xs font-medium text-primary'>Save ~20% with annual billing</p>
              )}
            </div>

            <div className='space-y-2 pt-2'>
              {plan.features.slice(0, 6).map((f) => (
                <div key={f} className='flex items-start gap-2'>
                  <Check
                    size={13}
                    className={`mt-0.5 shrink-0 ${plan.isPopular ? 'text-primary' : 'text-emerald-500'}`}
                  />
                  <span className='text-xs leading-relaxed'>
                    {f.replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </div>
              ))}
              {plan.limits.maxClients !== -1 && (
                <div className='flex items-start gap-2'>
                  <Check size={13} className={`mt-0.5 shrink-0 ${plan.isPopular ? 'text-primary' : 'text-emerald-500'}`} />
                  <span className='text-xs leading-relaxed'>Up to {plan.limits.maxClients} clients</span>
                </div>
              )}
              {plan.limits.maxClients === -1 && (
                <div className='flex items-start gap-2'>
                  <Check size={13} className={`mt-0.5 shrink-0 ${plan.isPopular ? 'text-primary' : 'text-emerald-500'}`} />
                  <span className='text-xs leading-relaxed'>Unlimited clients</span>
                </div>
              )}
            </div>
          </div>

          <div className='mt-6'>
            {isCurrent ? (
              <Button variant='outline' className='w-full gap-1.5' disabled>
                <Crown size={14} /> Current Plan
              </Button>
            ) : isDowngrade ? (
              <Button variant='outline' className='w-full gap-1.5' disabled>
                Downgrade not available
              </Button>
            ) : (
              <Button
                className={`w-full gap-1.5 ${plan.isPopular ? 'gradient-bg text-primary-foreground' : ''}`}
                variant={plan.isPopular ? 'default' : 'outline'}
                disabled={isActing}
                onClick={() => onAction(plan, interval)}
              >
                {isPending ? (
                  <Loader2 size={14} className='animate-spin' />
                ) : (
                  <Sparkles size={14} />
                )}
                {hasActiveSubscription ? 'Upgrade' : `Start Free Trial`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ─── Transaction history ──────────────────────────────────────────────────────

const TX_TYPE_LABELS: Record<string, string> = {
  trial_start:          'Trial started',
  subscription_created: 'Subscription activated',
  payment_succeeded:    'Payment successful',
  payment_failed:       'Payment failed',
  plan_upgraded:        'Plan upgraded',
  canceled:             'Subscription cancelled',
  account_locked:       'Account locked',
  account_restored:     'Account restored',
};

const TransactionHistory = () => {
  const { data, isLoading } = useSubscriptionTransactions({ page: 1, limit: 10 });

  if (isLoading) {
    return (
      <div className='flex h-24 items-center justify-center'>
        <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
      </div>
    );
  }

  const items = data?.data ?? [];

  if (!items.length) {
    return (
      <div className='flex h-24 items-center justify-center rounded-xl border border-dashed border-border'>
        <p className='text-sm text-muted-foreground'>No billing history yet.</p>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      {items.map((tx) => (
        <div
          key={tx._id}
          className='flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3'
        >
          <div className='flex items-center gap-2.5'>
            {txStatusIcon(tx.status)}
            <div>
              <p className='text-sm font-medium'>{TX_TYPE_LABELS[tx.type] ?? tx.type}</p>
              <p className='text-xs text-muted-foreground'>
                {new Date(tx.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div className='text-right'>
            {tx.amountUsd > 0 && (
              <p className='text-sm font-semibold'>{centsToDisplay(tx.amountUsd)}</p>
            )}
            <p className='text-xs capitalize text-muted-foreground'>{tx.plan}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main tab ─────────────────────────────────────────────────────────────────

const SubscriptionTab = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [actingSlug, setActingSlug] = useState<string | null>(null);
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null);
  const [pendingSubscribe, setPendingSubscribe] = useState<{
    plan: string;
    billingInterval: BillingInterval;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    plan: SubscriptionPlan;
    interval: BillingInterval;
  } | null>(null);

  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { sub, refreshSubscription, pollUntilPlanUpdated } = useSubscription();

  const upgradeMutation = useUpgradePlanMutation();
  const setupIntentMutation = useSetupIntentMutation();
  const subscribeMutation = useSubscribeMutation();

  const handleAction = async (plan: SubscriptionPlan, interval: BillingInterval) => {
    setActingSlug(plan.slug);
    try {
      const hasActiveSub =
        sub?.status && !['canceled'].includes(sub.status) && sub.plan;

      if (hasActiveSub) {
        // Upgrade flow
        await upgradeMutation.mutateAsync({ plan: plan.slug, billingInterval: interval });
        toast.success(`Upgrading to ${plan.name}… features will update shortly.`);
        pollUntilPlanUpdated(plan.slug);
      } else {
        // Subscribe flow — may need card
        if (!sub?.hasPaymentMethod) {
          const { clientSecret } = await setupIntentMutation.mutateAsync();
          setSetupClientSecret(clientSecret);
          setPendingSubscribe({ plan: plan.slug, billingInterval: interval });
        } else {
          await subscribeMutation.mutateAsync({ plan: plan.slug, billingInterval: interval });
          toast.success(`Your ${plan.name} trial has started!`);
          await refreshSubscription();
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActingSlug(null);
    }
  };

  const handleCardSaved = async (paymentMethodId?: string) => {
    if (!pendingSubscribe) return;
    setSetupClientSecret(null);
    try {
      await subscribeMutation.mutateAsync({
        ...pendingSubscribe,
        paymentMethodId,
      });
      toast.success('Trial started! Your card has been saved for renewal.');
      await refreshSubscription();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setPendingSubscribe(null);
    }
  };

  const isActing =
    upgradeMutation.isPending || setupIntentMutation.isPending || subscribeMutation.isPending;

  const sortedPlans = [...(plans ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className='space-y-8'>
      {/* Current plan summary */}
      {sub && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 px-5 py-4'
        >
          <div className='flex items-center gap-3'>
            <div className='flex h-9 w-9 items-center justify-center rounded-xl gradient-bg'>
              <Crown className='h-4 w-4 text-white' />
            </div>
            <div>
              <p className='text-sm font-semibold capitalize'>
                {sub.plan} Plan
              </p>
              <p className='text-xs text-muted-foreground capitalize'>{sub.billingInterval} billing</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {statusBadge(sub.status)}
            {sub.currentPeriodEnd && (
              <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                <Receipt className='h-3 w-3' />
                Renews{' '}
                {new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
            {sub.trialEndsAt && sub.status === 'trialing' && (
              <span className='flex items-center gap-1 text-xs text-blue-600'>
                <Clock className='h-3 w-3' />
                Trial ends{' '}
                {new Date(sub.trialEndsAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Billing toggle */}
      <div className='flex flex-col items-center justify-center gap-2 md:gap-3'>
        <div className='flex items-center gap-3 rounded-full border border-border bg-muted/50 px-4 py-2'>
          <Label
            htmlFor='billing-toggle'
            className={`cursor-pointer text-sm transition-colors ${
              !isYearly ? 'font-semibold text-foreground' : 'text-muted-foreground'
            }`}
          >
            Monthly
          </Label>
          <Switch id='billing-toggle' checked={isYearly} onCheckedChange={setIsYearly} />
          <Label
            htmlFor='billing-toggle'
            className={`cursor-pointer text-sm transition-colors ${
              isYearly ? 'font-semibold text-foreground' : 'text-muted-foreground'
            }`}
          >
            Yearly
          </Label>
        </div>
        {isYearly && (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className='text-center text-sm font-medium text-primary'
          >
            Save ~20% with annual billing
          </motion.p>
        )}
      </div>

      {/* Plans grid */}
      {plansLoading ? (
        <div className='flex h-48 items-center justify-center'>
          <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3'>
          {sortedPlans.map((plan, i) => (
            <PlanCard
              key={plan.slug}
              plan={plan}
              isYearly={isYearly}
              currentPlanSlug={sub?.plan ?? null}
              currentStatus={sub?.status ?? null}
              onAction={(p, interval) => setPendingAction({ plan: p, interval })}
              isActing={isActing}
              actingSlug={actingSlug}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Billing history */}
      <div className='space-y-4'>
        <h3 className='text-base font-semibold'>Billing History</h3>
        <TransactionHistory />
      </div>

      {/* Upgrade / subscribe confirmation */}
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => { if (!open) setPendingAction(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {sub?.plan
                ? `Upgrade to ${pendingAction?.plan.name ?? ''}?`
                : `Start ${pendingAction?.plan.name ?? ''} free trial?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {sub?.plan ? (
                <>
                  You&apos;re switching from your current{' '}
                  <strong className='text-foreground capitalize'>{sub.plan}</strong> plan to{' '}
                  <strong className='text-foreground'>{pendingAction?.plan.name}</strong> (
                  {pendingAction?.interval === 'yearly' ? 'billed yearly' : 'billed monthly'}).
                  Your plan updates immediately and any difference is prorated.
                </>
              ) : (
                <>
                  You&apos;ll start a free trial on the{' '}
                  <strong className='text-foreground'>{pendingAction?.plan.name}</strong> plan (
                  {pendingAction?.interval === 'yearly' ? 'billed yearly' : 'billed monthly'}).
                  No charge until your trial ends.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='gradient-bg border-0 text-white'
              onClick={() => {
                if (pendingAction) {
                  void handleAction(pendingAction.plan, pendingAction.interval);
                  setPendingAction(null);
                }
              }}
            >
              {sub?.plan ? 'Confirm upgrade' : 'Start trial'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stripe setup-intent card modal */}
      {setupClientSecret && (
        <StripeCardModal
          open={!!setupClientSecret}
          onClose={() => {
            setSetupClientSecret(null);
            setPendingSubscribe(null);
          }}
          mode='setup'
          clientSecret={setupClientSecret}
          onSuccess={(pmId) => void handleCardSaved(pmId)}
        />
      )}
    </div>
  );
};

export default SubscriptionTab;
