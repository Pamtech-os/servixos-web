'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  type BusinessProfile,
  type BusinessSubscription,
  type PayNowData,
  type SubscriptionStatus,
  subscription as subscriptionApi,
} from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { SUBSCRIPTION_ME_KEY } from '@/hooks/queries/use-subscription';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubscriptionContextType {
  profile: BusinessProfile | null;
  sub: BusinessSubscription | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<BusinessProfile | undefined>;
  pollUntilPlanUpdated: (slug: string) => void;
  triggerPayNow: () => void;
  payNowData: PayNowData | null;
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  isWelcomeModalOpen: boolean;
  setIsWelcomeModalOpen: (open: boolean) => void;
  onPaymentSuccess: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

type PollingTarget =
  | { type: 'plan'; slug: string }
  | { type: 'active' };

export function SubscriptionProvider({ children }: PropsWithChildren) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  const [pollingTarget, setPollingTarget] = useState<PollingTarget | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payNowData, setPayNowData] = useState<PayNowData | null>(null);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

  const pollAttemptsRef = useRef(0);
  const prevStatusRef = useRef<SubscriptionStatus | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [SUBSCRIPTION_ME_KEY, businessId],
    queryFn: () => subscriptionApi.me(businessId),
    enabled: !!businessId && auth.isPinVerified,
    staleTime: 30_000,
    refetchInterval: pollingTarget ? 2000 : false,
  });

  const profile = data ?? null;

  // Stop polling when the target condition is satisfied
  useEffect(() => {
    if (!pollingTarget || !profile) return;

    if (pollingTarget.type === 'plan') {
      pollAttemptsRef.current++;
      if (profile.subscription.plan === pollingTarget.slug || pollAttemptsRef.current >= 5) {
        setPollingTarget(null);
      }
    } else if (pollingTarget.type === 'active' && profile.subscription.status === 'active') {
      setPollingTarget(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.subscription.plan, profile?.subscription.status]);

  // Show welcome modal on trialing→active transition
  useEffect(() => {
    if (!profile) return;
    const curr = profile.subscription.status;
    const prev = prevStatusRef.current;
    if (curr === 'active' && prev !== null && prev !== 'active') {
      setIsWelcomeModalOpen(true);
    }
    prevStatusRef.current = curr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.subscription.status]);

  const refreshSubscription = useCallback(async (): Promise<BusinessProfile | undefined> => {
    const result = await refetch();
    return result.data;
  }, [refetch]);

  const pollUntilPlanUpdated = useCallback((slug: string) => {
    pollAttemptsRef.current = 0;
    setPollingTarget({ type: 'plan', slug });
  }, []);

  const pollUntilActive = useCallback(() => {
    setPollingTarget({ type: 'active' });
  }, []);

  const triggerPayNow = useCallback(async () => {
    if (!businessId) return;
    try {
      const data = await subscriptionApi.payNow(businessId);
      setPayNowData(data);
      setIsPaymentModalOpen(true);
    } catch {
      // error surfaced via toast in the calling component
    }
  }, [businessId]);

  const onPaymentSuccess = useCallback(() => {
    setIsPaymentModalOpen(false);
    setPayNowData(null);
    pollUntilActive();
  }, [pollUntilActive]);

  const value = useMemo<SubscriptionContextType>(
    () => ({
      profile,
      sub: profile?.subscription ?? null,
      isLoading,
      refreshSubscription,
      pollUntilPlanUpdated,
      triggerPayNow,
      payNowData,
      isPaymentModalOpen,
      setIsPaymentModalOpen,
      isWelcomeModalOpen,
      setIsWelcomeModalOpen,
      onPaymentSuccess,
    }),
    [
      profile,
      isLoading,
      refreshSubscription,
      pollUntilPlanUpdated,
      triggerPayNow,
      payNowData,
      isPaymentModalOpen,
      isWelcomeModalOpen,
      onPaymentSuccess,
    ]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
