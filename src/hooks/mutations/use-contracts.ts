'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contracts, type CreateContractInput, type UpdateContractInput } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useCreateContract() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateContractInput) => contracts.create(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contracts', businessId] });
    },
  });
}

export function useUpdateContract() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
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
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contracts.delete(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contracts', businessId] });
    },
  });
}

export function useSendContract() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
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
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useMutation({
    mutationFn: (id: string) => contracts.getPdf(businessId, id),
  });
}
