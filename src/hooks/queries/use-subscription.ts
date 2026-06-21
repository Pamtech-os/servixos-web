'use client';

import { useQuery } from '@tanstack/react-query';
import { subscription } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export const SUBSCRIPTION_ME_KEY = 'subscription-me';
export const SUBSCRIPTION_PLANS_KEY = 'subscription-plans';
export const SUBSCRIPTION_TRANSACTIONS_KEY = 'subscription-transactions';

export function useBusinessProfile() {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: [SUBSCRIPTION_ME_KEY, businessId],
    queryFn: () => subscription.me(businessId),
    enabled: isReady,
    staleTime: 30_000,
  });
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: [SUBSCRIPTION_PLANS_KEY],
    queryFn: () => subscription.plans(),
    staleTime: 5 * 60_000,
  });
}

export function useSubscriptionTransactions(query: { page?: number; limit?: number } = {}) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: [SUBSCRIPTION_TRANSACTIONS_KEY, businessId, query],
    queryFn: () => subscription.transactions(businessId, query),
    enabled: isReady,
  });
}
