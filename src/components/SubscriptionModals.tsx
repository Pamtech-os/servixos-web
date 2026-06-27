'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import GracePeriodModal from '@/components/GracePeriodModal';
import SubscriptionLockedModal from '@/components/SubscriptionLockedModal';
import WelcomePlanModal from '@/components/WelcomePlanModal';

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
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isWelcomeModalOpen,
    setIsWelcomeModalOpen,
    onPaymentSuccess,
  } = useSubscription();
  const { auth } = useAuth();

  const [gracePeriodDismissed, setGracePeriodDismissed] = useState(false);
  const prevPinVerifiedRef = useRef(auth.isPinVerified);

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
        open={isGracePeriod && !isPaymentModalOpen && !gracePeriodDismissed}
        onOpenChange={(open) => { if (!open) setGracePeriodDismissed(true); }}
        planName={planLabel(sub?.plan ?? '')}
        billingCycle={billingLabel(sub?.billingInterval ?? 'monthly')}
        renewalAmount={(sub?.pendingAmountDue ?? 0) / 100}
        currency={sub?.pendingCurrency ?? 'usd'}
        daysRemaining={daysRemaining(sub?.gracePeriodEndsAt ?? null)}
        dueDate={formatDate(sub?.gracePeriodEndsAt ?? null)}
        onPayNow={() => { setGracePeriodDismissed(false); void triggerPayNow(); }}
        onCancel={() => setGracePeriodDismissed(true)}
      />

      {/* Locked modal */}
      <SubscriptionLockedModal
        open={isLocked && !isPaymentModalOpen}
        planName={planLabel(sub?.plan ?? '')}
        billingCycle={billingLabel(sub?.billingInterval ?? 'monthly')}
        renewalAmount={(sub?.pendingAmountDue ?? 0) / 100}
        currency={sub?.pendingCurrency ?? 'usd'}
        lockedSince={formatDate(sub?.currentPeriodEnd ?? null)}
        fromTrial={sub?.gracePeriodEndsAt === null}
        onPayNow={() => void triggerPayNow()}
      />

      {/* Stripe payment modal (for pay-now) */}
      {isPaymentModalOpen && payNowData && (
        <StripeCardModal
          open={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          mode='payment'
          clientSecret={payNowData.clientSecret}
          amountCents={payNowData.amountDue}
          currency={payNowData.currency}
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
