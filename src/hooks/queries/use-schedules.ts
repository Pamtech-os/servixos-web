'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { schedules, type SchedulesQuery } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useSchedules(query: SchedulesQuery = {}, options?: { enabled?: boolean }) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['schedules', businessId, query],
    queryFn: () => schedules.list(businessId, query),
    enabled: isReady && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
  });
}
