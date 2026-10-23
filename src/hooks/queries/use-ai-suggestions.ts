'use client';

import { useQuery } from '@tanstack/react-query';
import { aiSuggestions } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export const AI_SUGGESTIONS_KEY = 'ai-suggestions';
export const AI_SUGGESTIONS_TRACKED_KEY = 'ai-suggestions-tracked';

export function useAiSuggestions() {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: [AI_SUGGESTIONS_KEY, businessId],
    queryFn: () => aiSuggestions.list(businessId),
    enabled: isReady,
  });
}

// Outcomes are evaluated server-side on each call, so refetch whenever the panel opens.
export function useTrackedSuggestions(isVisible: boolean) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: [AI_SUGGESTIONS_TRACKED_KEY, businessId],
    queryFn: () => aiSuggestions.tracked(businessId),
    enabled: isReady && isVisible,
    staleTime: 0,
  });
}
