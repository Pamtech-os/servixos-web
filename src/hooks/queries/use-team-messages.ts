'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { teamMessages } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export const TEAM_MESSAGES_LIMIT = 50;

export function useTeamMessages(options?: { enabled?: boolean }) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useInfiniteQuery({
    queryKey: ['team-messages', businessId],
    queryFn: ({ pageParam }) =>
      teamMessages.list(businessId, { page: pageParam as number, limit: TEAM_MESSAGES_LIMIT }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    enabled: !!businessId && auth.isPinVerified && (options?.enabled ?? true),
  });
}
