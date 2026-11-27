'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceRequests, type UpdateRequestInput } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import { AI_SUGGESTIONS_KEY } from '@/hooks/queries/use-ai-suggestions';

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
        // The job is created in the background; its "Generate contract" card follows, and the
        // ai_suggestions_changed socket event refetches again once the job exists.
        void queryClient.invalidateQueries({ queryKey: [AI_SUGGESTIONS_KEY, businessId] });
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
