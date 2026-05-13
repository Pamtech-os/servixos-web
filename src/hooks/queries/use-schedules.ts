'use client';

import { useQuery } from '@tanstack/react-query';
import { schedules, type SchedulesQuery } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useSchedules(query: SchedulesQuery = {}, options?: { enabled?: boolean }) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['schedules', businessId, query],
    queryFn: () => schedules.list(businessId, query),
    enabled: !!businessId && auth.isPinVerified && (options?.enabled ?? true),
  });
}
