'use client';

import { useQuery } from '@tanstack/react-query';
import { aiPriorities } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export const AI_PRIORITIES_KEY = 'ai-priorities';

export function useAiPriorities() {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: [AI_PRIORITIES_KEY, businessId],
    queryFn: () => aiPriorities.get(businessId),
    enabled: isReady,
  });
}
