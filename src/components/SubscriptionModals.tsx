'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import GracePeriodModal from '@/components/GracePeriodModal';
import SubscriptionLockedModal from '@/components/SubscriptionLockedModal';
import WelcomePlanModal from '@/components/WelcomePlanModal';
import { subscription as subscriptionApi } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage } from '@/common/network/http-client';

// Lazy-load StripeCardModal so loadStripe() and Stripe's iframes only
// initialize when a payment modal actually needs to open — not on every page.
const StripeCardModal = dynamic(() => import('@/components/StripeCardModal'), {
  ssr: false,
});

function planLabel(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function billingLabel(interval: string): string {
  return interval === 'yearly' ? 'Yearly' : 'Monthly';
}

function daysRemaining(isoDate: string | null): number {
  if (!isoDate) return 0;
  const diff = new Date(isoDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function formatDate(isoDate: string | null): string {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const SubscriptionModals = () => {
  const {
    sub,
    profile,
    triggerPayNow,
    payNowData,
    payNowPaymentMethodId,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isWelcomeModalOpen,
    setIsWelcomeModalOpen,
    onPaymentSuccess,
  } = useSubscription();
  const { auth } = useAuth();

  const businessId = auth.user?.businessId ?? '';

  const [gracePeriodDismissed, setGracePeriodDismissed] = useState(false);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isSetupPending, setIsSetupPending] = useState(false);
  const prevPinVerifiedRef = useRef(auth.isPinVerified);

  const handleLockedPayNow = async () => {
    if (!sub?.hasPaymentMethod) {
      setIsSetupPending(true);
      try {
        const data = await subscriptionApi.setupIntent(businessId);
        setSetupSecret(data.clientSecret);
        setIsSetupModalOpen(true);
      } catch (err) {
        toast.error('Failed to load payment form', { description: getApiErrorMessage(err) });
      } finally {
        setIsSetupPending(false);
      }
    } else {
      void triggerPayNow();
    }
  };

  const handleSetupSuccess = (paymentMethodId?: string) => {
    setIsSetupModalOpen(false);
    setSetupSecret(null);
    void triggerPayNow(paymentMethodId);
  };

  // Reset dismissed state on every new login (isPinVerified: false → true).
  // SubscriptionModals never unmounts, so local state survives logout/login.
  useEffect(() => {
    if (!prevPinVerifiedRef.current && auth.isPinVerified) {
      setGracePeriodDismissed(false);
    }
    prevPinVerifiedRef.current = auth.isPinVerified;
  }, [auth.isPinVerified]);

  const isGracePeriod = sub?.status === 'grace_period';
  const isLocked = sub?.status === 'locked';

  const welcomeFeatures = useMemo(() => {
    if (!sub?.features?.length) return undefined;
    return sub.features.slice(0, 4).map((f) =>
      f.replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    );
  }, [sub?.features]);

  return (
    <>
      {/* Grace period modal */}
      <GracePeriodModal
        open={isGracePeriod && !isPaymentModalOpen && !isSetupModalOpen && !gracePeriodDismissed}
        onOpenChange={(open) => { if (!open) setGracePeriodDismissed(true); }}
        planName={planLabel(sub?.plan ?? '')}
        billingCycle={billingLabel(sub?.billingInterval ?? 'monthly')}
        renewalAmount={(sub?.pendingAmountDue ?? 0) / 100}
        currency={sub?.pendingCurrency ?? 'usd'}
        daysRemaining={daysRemaining(sub?.gracePeriodEndsAt ?? null)}
        dueDate={formatDate(sub?.gracePeriodEndsAt ?? null)}
        isPending={isSetupPending}
        onPayNow={() => { setGracePeriodDismissed(false); void handleLockedPayNow(); }}
        onCancel={() => setGracePeriodDismissed(true)}
      />

      {/* Locked modal */}
      <SubscriptionLockedModal
        open={isLocked && !isPaymentModalOpen && !isSetupModalOpen}
        planName={planLabel(sub?.plan ?? '')}
        billingCycle={billingLabel(sub?.billingInterval ?? 'monthly')}
        renewalAmount={(sub?.pendingAmountDue ?? 0) / 100}
        currency={sub?.pendingCurrency ?? 'usd'}
        lockedSince={formatDate(sub?.currentPeriodEnd ?? null)}
        fromTrial={sub?.gracePeriodEndsAt === null}
        isPending={isSetupPending}
        onPayNow={() => void handleLockedPayNow()}
      />

      {/* Card collection modal (when no payment method is on file) */}
      {isSetupModalOpen && setupSecret && (
        <StripeCardModal
          open={isSetupModalOpen}
          onClose={() => { setIsSetupModalOpen(false); setSetupSecret(null); }}
          mode='setup'
          clientSecret={setupSecret}
          onSuccess={handleSetupSuccess}
        />
      )}

      {/* Stripe payment modal (for pay-now) */}
      {isPaymentModalOpen && payNowData && (
        <StripeCardModal
          open={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          mode='payment'
          clientSecret={payNowData.clientSecret}
          amountCents={payNowData.amountDue}
          currency={payNowData.currency}
          paymentMethodId={payNowPaymentMethodId ?? undefined}
          onSuccess={onPaymentSuccess}
        />
      )}

      {/* Welcome modal (shown once on first active transition) */}
      <WelcomePlanModal
        open={isWelcomeModalOpen}
        onOpenChange={setIsWelcomeModalOpen}
        planName={planLabel(sub?.plan ?? profile?.subscription.plan ?? '')}
        features={welcomeFeatures}
      />
    </>
  );
};

export default SubscriptionModals;
