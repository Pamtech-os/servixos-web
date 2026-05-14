'use client';

import { useQuery } from '@tanstack/react-query';
import { analytics, type TrafficQuery } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useAnalyticsTraffic(query: TrafficQuery = {}) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['analytics-traffic', businessId, query],
    queryFn: () => analytics.traffic(businessId, query),
    enabled: !!businessId && auth.isPinVerified,
    staleTime: 10 * 60 * 1000,
  });
}

export function useAnalyticsRevenue(months?: number) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['analytics-revenue', businessId, months],
    queryFn: () => analytics.revenue(businessId, months),
    enabled: !!businessId && auth.isPinVerified,
    staleTime: 10 * 60 * 1000,
  });
}

export function useAnalyticsJobs() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['analytics-jobs', businessId],
    queryFn: () => analytics.jobs(businessId),
    enabled: !!businessId && auth.isPinVerified,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsDashboard() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['analytics-dashboard', businessId],
    queryFn: () => analytics.dashboard(businessId),
    enabled: !!businessId && auth.isPinVerified,
    staleTime: 5 * 60 * 1000,
  });
}
