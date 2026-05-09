'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roles, type CreateRoleInput, type UpdateRoleInput } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useCreateRole() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRoleInput) => roles.create(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles', businessId] });
    },
  });
}

export function useUpdateRole() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoleInput }) =>
      roles.update(businessId, id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles', businessId] });
    },
  });
}

export function useDeleteRole() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => roles.delete(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles', businessId] });
    },
  });
}
