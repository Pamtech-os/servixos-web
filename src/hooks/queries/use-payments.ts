'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { payments, type PaymentsQuery } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function usePayments(query: PaymentsQuery = {}) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['payments', businessId, query],
    queryFn: () => payments.list(businessId, query),
    enabled: isReady,
    placeholderData: keepPreviousData,
  });
}

export function usePayment(id: string) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['payments', businessId, id],
    queryFn: () => payments.get(businessId, id),
    enabled: isReady && !!id,
  });
}
