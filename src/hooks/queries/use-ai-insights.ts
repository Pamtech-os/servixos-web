'use client';

import { useQuery } from '@tanstack/react-query';
import { aiInsights, type InsightsQuery } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useAiInsights(query: InsightsQuery = {}) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['ai-insights', businessId, query],
    queryFn: () => aiInsights.list(businessId, query),
    enabled: isReady,
  });
}
