'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { announcements, type AnnouncementsQuery } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useAnnouncements(query: AnnouncementsQuery = {}, options?: { enabled?: boolean }) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['announcements', businessId, query],
    queryFn: () => announcements.list(businessId, query),
    enabled: isReady && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
  });
}
