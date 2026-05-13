'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { announcements, type CreateAnnouncementInput } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useCreateAnnouncement() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAnnouncementInput) => announcements.create(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['announcements', businessId] });
    },
  });
}
