'use client';

import { useQuery } from '@tanstack/react-query';
import { serviceRequests, type ServiceRequestsQuery } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { HttpError } from '@/common/network/http-client';

const CLIENT_NOT_PROVISIONED_MESSAGE = 'client not provisioned';

export function isClientProvisioningPendingError(error: unknown): boolean {
  if (!(error instanceof HttpError) || error.status !== 404) return false;
  return error.message.toLowerCase().includes(CLIENT_NOT_PROVISIONED_MESSAGE);
}

export function useServiceRequests(query: ServiceRequestsQuery = {}) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['requests', businessId, query],
    queryFn: () => serviceRequests.list(businessId, query),
    enabled: !!businessId && auth.isPinVerified,
  });
}

export function useServiceRequest(id: string) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['requests', businessId, id],
    queryFn: () => serviceRequests.get(businessId, id),
    enabled: !!businessId && auth.isPinVerified && !!id,
  });
}

export function useRequestConversation(
  id: string,
  enabled = false,
  options?: { retryOnClientProvisioning?: boolean; pollingInterval?: number }
) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const retryOnClientProvisioning = options?.retryOnClientProvisioning ?? false;
  const pollingInterval = options?.pollingInterval;

  return useQuery({
    queryKey: ['requests', businessId, id, 'conversation'],
    queryFn: () => serviceRequests.getConversation(businessId, id),
    enabled: !!businessId && auth.isPinVerified && !!id && enabled,
    refetchInterval: (query) => {
      if (retryOnClientProvisioning && isClientProvisioningPendingError(query.state.error)) {
        return 3000;
      }
      return pollingInterval ?? false;
    },
    refetchIntervalInBackground: true,
  });
}

export function useRequestPriceEstimate(id: string) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['requests', businessId, id, 'price-estimate'],
    queryFn: () => serviceRequests.getPriceEstimate(businessId, id),
    enabled: false,
  });
}
