'use client';

import { useQuery } from '@tanstack/react-query';
import { invoices, type InvoicesQuery } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useInvoices(query: InvoicesQuery = {}) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['invoices', businessId, query],
    queryFn: () => invoices.list(businessId, query),
    enabled: !!businessId && auth.isPinVerified,
  });
}

export function useInvoice(id: string) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['invoices', businessId, id],
    queryFn: () => invoices.get(businessId, id),
    enabled: !!businessId && auth.isPinVerified && !!id,
  });
}
