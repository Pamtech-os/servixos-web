'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { clients, type ClientsQuery } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useClients(query: ClientsQuery = {}) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['clients', businessId, query],
    queryFn: () => clients.list(businessId, query),
    enabled: isReady,
    placeholderData: keepPreviousData,
  });
}

export function useClient(id: string) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['clients', businessId, id],
    queryFn: () => clients.get(businessId, id),
    enabled: isReady && !!id,
  });
}
