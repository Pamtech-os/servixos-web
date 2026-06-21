'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { activityLogs, type ActivityLogsQuery } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useActivityLogs(query: ActivityLogsQuery = {}) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['activity-logs', businessId, query],
    queryFn: () => activityLogs.list(businessId, query),
    enabled: isReady,
    placeholderData: keepPreviousData,
  });
}
