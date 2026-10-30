'use client';

import { useQuery } from '@tanstack/react-query';
import { onboarding, onboardingWorkspace } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export const ONBOARDING_STATUS_KEY = 'onboarding-status';
export const ONBOARDING_SESSION_KEY = 'onboarding-session';
export const ONBOARDING_PREVIEW_KEY = 'onboarding-preview';

export function useOnboardingStatus(options: { refetchWhilePending?: boolean } = {}) {
  const { auth } = useAuth();

  return useQuery({
    queryKey: [ONBOARDING_STATUS_KEY, auth.user?.id],
    queryFn: () => onboarding.status(),
    enabled: auth.isLoggedIn,
    staleTime: 0,
    // The registration number is checked in the background; poll until it settles.
    refetchInterval: (query) =>
      options.refetchWhilePending && query.state.data?.businessRegistration?.status === 'pending'
        ? 5_000
        : false,
  });
}

export function useOnboardingSession(enabled: boolean) {
  return useQuery({
    queryKey: [ONBOARDING_SESSION_KEY],
    queryFn: () => onboardingWorkspace.session(),
    enabled,
    staleTime: Infinity,
  });
}

export function useWebsitePreview(enabled: boolean) {
  return useQuery({
    queryKey: [ONBOARDING_PREVIEW_KEY],
    queryFn: () => onboardingWorkspace.preview(),
    enabled,
    staleTime: Infinity,
  });
}
