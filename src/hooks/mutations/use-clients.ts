'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clients, type CreateClientInput, type UpdateClientInput } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useCreateClient() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateClientInput) => clients.create(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients', businessId] });
    },
  });
}

export function useUpdateClient() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClientInput }) =>
      clients.update(businessId, id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients', businessId] });
    },
  });
}

export function useDeleteClient() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clients.delete(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients', businessId] });
    },
  });
}

export function useExportClient() {
  const { businessId } = useBusinessAuth();

  return useMutation({
    mutationFn: (id: string) => clients.export(businessId, id),
  });
}
