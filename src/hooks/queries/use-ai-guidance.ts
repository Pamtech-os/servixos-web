'use client';

import { useQuery } from '@tanstack/react-query';
import { aiGuidance } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export const AI_GUIDANCE_KEY = 'ai-guidance';

export function useAiGuidance() {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: [AI_GUIDANCE_KEY, businessId],
    queryFn: () => aiGuidance.get(businessId),
    enabled: isReady,
    // The plan is written in the background; poll until it lands.
    refetchInterval: (query) => (query.state.data?.plan?.status === 'generating' ? 5_000 : false),
  });
}
