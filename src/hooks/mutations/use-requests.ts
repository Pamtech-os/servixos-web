'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceRequests, type UpdateRequestInput } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useUpdateRequest() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRequestInput }) =>
      serviceRequests.update(businessId, id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests', businessId] });
    },
  });
}

export function useDeleteRequest() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => serviceRequests.delete(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests', businessId] });
    },
  });
}
