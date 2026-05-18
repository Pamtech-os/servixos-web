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

export function useContractByJob(jobId: string | undefined, clientId: string | undefined) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['contracts', businessId, 'byJob', jobId],
    queryFn: async () => {
      const result = await contracts.list(businessId, { clientId: clientId! });
      return result.data.find((c) => c.jobId === jobId) ?? null;
    },
    enabled: !!businessId && auth.isPinVerified && !!jobId && !!clientId,
    staleTime: 30_000,
    // Poll every 30s while awaiting client signature
    refetchInterval: (query) => (query.state.data?.status === 'sent' ? 30_000 : false),
  });
}
