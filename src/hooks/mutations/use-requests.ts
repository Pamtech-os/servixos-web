'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceRequests, type UpdateRequestInput } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useUpdateRequest() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRequestInput }) =>
      serviceRequests.update(businessId, id, input),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['requests', businessId] });
      if (updated.status === 'accepted') {
        void queryClient.invalidateQueries({ queryKey: ['jobs', businessId] });
      }
    },
  });
}

export function useDeleteRequest() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => serviceRequests.delete(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests', businessId] });
    },
  });
}
