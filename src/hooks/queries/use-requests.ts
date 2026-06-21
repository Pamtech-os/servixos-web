'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { serviceRequests, type ServiceRequestsQuery } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import { HttpError } from '@/common/network/http-client';

const CLIENT_NOT_PROVISIONED_MESSAGE = 'client not provisioned';

export function isClientProvisioningPendingError(error: unknown): boolean {
  if (!(error instanceof HttpError) || error.status !== 404) return false;
  return error.message.toLowerCase().includes(CLIENT_NOT_PROVISIONED_MESSAGE);
}

export function useServiceRequests(query: ServiceRequestsQuery = {}) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['requests', businessId, query],
    queryFn: () => serviceRequests.list(businessId, query),
    enabled: isReady,
    placeholderData: keepPreviousData,
  });
}

export function useServiceRequest(id: string) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['requests', businessId, id],
    queryFn: () => serviceRequests.get(businessId, id),
    enabled: isReady && !!id,
  });
}

export function useRequestConversation(
  id: string,
  enabled = false,
  options?: { retryOnClientProvisioning?: boolean; pollingInterval?: number }
) {
  const { businessId, isReady } = useBusinessAuth();
  const retryOnClientProvisioning = options?.retryOnClientProvisioning ?? false;
  const pollingInterval = options?.pollingInterval;

  return useQuery({
    queryKey: ['requests', businessId, id, 'conversation'],
    queryFn: () => serviceRequests.getConversation(businessId, id),
    enabled: isReady && !!id && enabled,
    refetchInterval: (query) => {
      if (retryOnClientProvisioning && isClientProvisioningPendingError(query.state.error)) {
        return 3000;
      }
      return pollingInterval ?? false;
    },
    refetchIntervalInBackground: false,
  });
}

export function useRequestPriceEstimate(id: string) {
  const { businessId } = useBusinessAuth();

  return useQuery({
    queryKey: ['requests', businessId, id, 'price-estimate'],
    queryFn: () => serviceRequests.getPriceEstimate(businessId, id),
    enabled: false,
  });
}
