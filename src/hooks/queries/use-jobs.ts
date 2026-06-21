'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { jobs, type JobsQuery } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useJobs(query: JobsQuery = {}) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['jobs', businessId, query],
    queryFn: () => jobs.list(businessId, query),
    enabled: isReady,
    placeholderData: keepPreviousData,
  });
}

export function useJob(id: string) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['jobs', businessId, id],
    queryFn: () => jobs.get(businessId, id),
    enabled: isReady && !!id,
  });
}
