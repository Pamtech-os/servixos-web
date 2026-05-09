'use client';

import { useQuery } from '@tanstack/react-query';
import { jobs, type JobsQuery } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useJobs(query: JobsQuery = {}) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['jobs', businessId, query],
    queryFn: () => jobs.list(businessId, query),
    enabled: !!businessId && auth.isPinVerified,
  });
}

export function useJob(id: string) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['jobs', businessId, id],
    queryFn: () => jobs.get(businessId, id),
    enabled: !!businessId && auth.isPinVerified && !!id,
  });
}
