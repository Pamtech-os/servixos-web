'use client';

import { useQuery } from '@tanstack/react-query';
import { announcements, type AnnouncementsQuery } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useAnnouncements(query: AnnouncementsQuery = {}) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['announcements', businessId, query],
    queryFn: () => announcements.list(businessId, query),
    enabled: !!businessId && auth.isPinVerified,
  });
}
