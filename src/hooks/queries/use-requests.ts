'use client';

import { useQuery } from '@tanstack/react-query';
import { serviceRequests, type ServiceRequestsQuery } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

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

export function useRequestConversation(id: string, enabled = false) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['requests', businessId, id, 'conversation'],
    queryFn: () => serviceRequests.getConversation(businessId, id),
    enabled: !!businessId && auth.isPinVerified && !!id && enabled,
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
