'use client';

import { useQuery } from '@tanstack/react-query';
import { contracts, type ContractsQuery } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useContracts(query: ContractsQuery = {}) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['contracts', businessId, query],
    queryFn: () => contracts.list(businessId, query),
    enabled: !!businessId && auth.isPinVerified,
  });
}

export function useContract(id: string) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['contracts', businessId, id],
    queryFn: () => contracts.get(businessId, id),
    enabled: !!businessId && auth.isPinVerified && !!id,
  });
}
