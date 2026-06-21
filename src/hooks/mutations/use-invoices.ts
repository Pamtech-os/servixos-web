'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoices, type CreateInvoiceInput, type UpdateInvoiceInput } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useCreateInvoice() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => invoices.create(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
    },
  });
}

export function useUpdateInvoice() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateInvoiceInput }) =>
      invoices.update(businessId, id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
    },
  });
}

export function useDeleteInvoice() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoices.delete(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
    },
  });
}

export function useSendInvoice() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoices.send(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
    },
  });
}

export function useGetInvoicePdf() {
  const { businessId } = useBusinessAuth();

  return useMutation({
    mutationFn: (id: string) => invoices.getPdf(businessId, id),
  });
}
