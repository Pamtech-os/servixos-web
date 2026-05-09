'use client';

import { useQuery } from '@tanstack/react-query';
import { clients, type ClientsQuery } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useClients(query: ClientsQuery = {}) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['clients', businessId, query],
    queryFn: () => clients.list(businessId, query),
    enabled: !!businessId && auth.isPinVerified,
  });
}

export function useClient(id: string) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['clients', businessId, id],
    queryFn: () => clients.get(businessId, id),
    enabled: !!businessId && auth.isPinVerified && !!id,
  });
}
