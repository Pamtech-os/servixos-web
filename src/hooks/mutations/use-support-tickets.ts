'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supportTickets, type CreateSupportTicketInput } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useCreateSupportTicket() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSupportTicketInput) => supportTickets.create(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['support-tickets', businessId] });
    },
  });
}
