'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { contracts, type ContractsQuery } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useContracts(query: ContractsQuery = {}) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['contracts', businessId, query],
    queryFn: () => contracts.list(businessId, query),
    enabled: isReady,
    placeholderData: keepPreviousData,
  });
}

export function useContract(id: string) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['contracts', businessId, id],
    queryFn: () => contracts.get(businessId, id),
    enabled: isReady && !!id,
  });
}

export function useContractByJob(jobId: string | undefined, clientId: string | undefined) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['contracts', businessId, 'byJob', jobId],
    queryFn: async () => {
      const result = await contracts.list(businessId, { clientId: clientId! });
      return result.data.find((c) => c.jobId === jobId) ?? null;
    },
    enabled: isReady && !!jobId && !!clientId,
    staleTime: 30_000,
    // Poll every 30s while awaiting client signature
    refetchInterval: (query) => (query.state.data?.status === 'sent' ? 30_000 : false),
  });
}
