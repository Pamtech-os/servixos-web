'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supportTickets, type CreateSupportTicketInput } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useCreateSupportTicket() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSupportTicketInput) => supportTickets.create(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['support-tickets', businessId] });
    },
  });
}
