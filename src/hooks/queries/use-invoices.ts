'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { invoices, type InvoicesQuery } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useInvoices(query: InvoicesQuery = {}) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['invoices', businessId, query],
    queryFn: () => invoices.list(businessId, query),
    enabled: isReady,
    placeholderData: keepPreviousData,
  });
}

export function useInvoice(id: string) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['invoices', businessId, id],
    queryFn: () => invoices.get(businessId, id),
    enabled: isReady && !!id,
  });
}
