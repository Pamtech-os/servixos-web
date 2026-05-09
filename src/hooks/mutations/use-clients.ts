'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clients, type CreateClientInput, type UpdateClientInput } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useCreateClient() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateClientInput) => clients.create(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients', businessId] });
    },
  });
}

export function useUpdateClient() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
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
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clients.delete(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients', businessId] });
    },
  });
}

export function useExportClient() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useMutation({
    mutationFn: (id: string) => clients.export(businessId, id),
  });
}
