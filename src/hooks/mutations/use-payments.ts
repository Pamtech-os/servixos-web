'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payments, type CreatePaymentInput, type UpdatePaymentInput } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useCreatePayment() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePaymentInput) => payments.create(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments', businessId] });
      void queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
    },
  });
}

export function useUpdatePayment() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePaymentInput }) =>
      payments.update(businessId, id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments', businessId] });
      void queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
    },
  });
}

export function useDeletePayment() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => payments.delete(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments', businessId] });
      void queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
    },
  });
}
