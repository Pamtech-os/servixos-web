'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoices, type CreateInvoiceInput, type UpdateInvoiceInput } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useCreateInvoice() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => invoices.create(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
    },
  });
}

export function useUpdateInvoice() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
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
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoices.delete(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
    },
  });
}

export function useSendInvoice() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoices.send(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
    },
  });
}

export function useGetInvoicePdf() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useMutation({
    mutationFn: (id: string) => invoices.getPdf(businessId, id),
  });
}
