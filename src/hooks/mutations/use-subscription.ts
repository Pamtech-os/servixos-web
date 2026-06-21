'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  subscription,
  type SubscribeInput,
  type UpgradePlanInput,
} from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import { SUBSCRIPTION_ME_KEY } from '@/hooks/queries/use-subscription';

export function useSetupIntentMutation() {
  const { businessId } = useBusinessAuth();

  return useMutation({
    mutationFn: () => subscription.setupIntent(businessId),
  });
}

export function useSubscribeMutation() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubscribeInput) => subscription.subscribe(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_ME_KEY, businessId] });
    },
  });
}

export function useUpgradePlanMutation() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpgradePlanInput) => subscription.upgrade(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_ME_KEY, businessId] });
    },
  });
}

export function useCancelSubscriptionMutation() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => subscription.cancel(businessId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_ME_KEY, businessId] });
    },
  });
}

export function usePayNowMutation() {
  const { businessId } = useBusinessAuth();

  return useMutation({
    mutationFn: () => subscription.payNow(businessId),
  });
}
