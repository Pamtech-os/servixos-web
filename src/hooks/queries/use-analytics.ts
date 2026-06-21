'use client';

import { useQuery } from '@tanstack/react-query';
import { analytics, type TrafficQuery } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useAnalyticsTraffic(query: TrafficQuery = {}) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['analytics-traffic', businessId, query],
    queryFn: () => analytics.traffic(businessId, query),
    enabled: isReady,
    staleTime: 10 * 60 * 1000,
  });
}

export function useAnalyticsRevenue(months?: number) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['analytics-revenue', businessId, months],
    queryFn: () => analytics.revenue(businessId, months),
    enabled: isReady,
    staleTime: 10 * 60 * 1000,
  });
}

export function useAnalyticsJobs() {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['analytics-jobs', businessId],
    queryFn: () => analytics.jobs(businessId),
    enabled: isReady,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsDashboard() {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['analytics-dashboard', businessId],
    queryFn: () => analytics.dashboard(businessId),
    enabled: isReady,
    staleTime: 5 * 60 * 1000,
  });
}
