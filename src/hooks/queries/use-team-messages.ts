'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { teamMessages } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export const TEAM_MESSAGES_LIMIT = 50;

export function useTeamMessages(options?: { enabled?: boolean }) {
  const { businessId, isReady } = useBusinessAuth();

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
    enabled: isReady && (options?.enabled ?? true),
  });
}
