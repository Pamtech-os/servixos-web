'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payments, type CreatePaymentInput, type UpdatePaymentInput } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useCreatePayment() {
  const { businessId } = useBusinessAuth();
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
  const { businessId } = useBusinessAuth();
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
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => payments.delete(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments', businessId] });
      void queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
    },
  });
}
