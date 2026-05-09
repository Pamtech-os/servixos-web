'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { activityLogs, type ActivityLogsQuery } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useActivityLogs(query: ActivityLogsQuery = {}) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['activity-logs', businessId, query],
    queryFn: () => activityLogs.list(businessId, query),
    enabled: !!businessId && auth.isPinVerified,
    placeholderData: keepPreviousData,
  });
}
