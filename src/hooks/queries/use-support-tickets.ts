'use client';

import { useQuery } from '@tanstack/react-query';
import { supportTickets, type SupportTicketsQuery } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useSupportTickets(query: SupportTicketsQuery = {}) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['support-tickets', businessId, query],
    queryFn: () => supportTickets.list(businessId, query),
    enabled: !!businessId && auth.isPinVerified,
  });
}

export function useSupportTicket(id: string) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['support-tickets', businessId, id],
    queryFn: () => supportTickets.get(businessId, id),
    enabled: !!businessId && auth.isPinVerified && !!id,
  });
}
