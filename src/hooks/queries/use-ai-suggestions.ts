'use client';

import { useQuery } from '@tanstack/react-query';
import { aiSuggestions } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export const AI_SUGGESTIONS_KEY = 'ai-suggestions';

export function useAiSuggestions() {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: [AI_SUGGESTIONS_KEY, businessId],
    queryFn: () => aiSuggestions.list(businessId),
    enabled: isReady,
  });
}
