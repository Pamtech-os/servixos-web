'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { announcements, type CreateAnnouncementInput } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useCreateAnnouncement() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAnnouncementInput) => announcements.create(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['announcements', businessId] });
    },
  });
}
