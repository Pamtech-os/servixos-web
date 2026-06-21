'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supportTickets, type SupportTicketsQuery } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useSupportTickets(query: SupportTicketsQuery = {}) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['support-tickets', businessId, query],
    queryFn: () => supportTickets.list(businessId, query),
    enabled: isReady,
    placeholderData: keepPreviousData,
  });
}

export function useSupportTicket(id: string) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['support-tickets', businessId, id],
    queryFn: () => supportTickets.get(businessId, id),
    enabled: isReady && !!id,
  });
}
