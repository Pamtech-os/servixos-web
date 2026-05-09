'use client';

import { useQuery } from '@tanstack/react-query';
import { payments, type PaymentsQuery } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function usePayments(query: PaymentsQuery = {}) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['payments', businessId, query],
    queryFn: () => payments.list(businessId, query),
    enabled: !!businessId && auth.isPinVerified,
  });
}

export function usePayment(id: string) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['payments', businessId, id],
    queryFn: () => payments.get(businessId, id),
    enabled: !!businessId && auth.isPinVerified && !!id,
  });
}
