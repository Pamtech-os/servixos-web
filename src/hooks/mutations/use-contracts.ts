'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contracts, type CreateContractInput, type UpdateContractInput } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useCreateContract() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateContractInput) => contracts.create(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contracts', businessId] });
    },
  });
}

export function useUpdateContract() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateContractInput }) =>
      contracts.update(businessId, id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contracts', businessId] });
    },
  });
}

export function useDeleteContract() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contracts.delete(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contracts', businessId] });
    },
  });
}

export function useSendContract() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, clientEmail }: { id: string; clientEmail: string }) =>
      contracts.send(businessId, id, clientEmail),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contracts', businessId] });
    },
  });
}

export function useGetContractPdf() {
  const { businessId } = useBusinessAuth();

  return useMutation({
    mutationFn: (id: string) => contracts.getPdf(businessId, id),
  });
}
