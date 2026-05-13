'use client';

import { useMutation } from '@tanstack/react-query';
import { teamMessages, type SendTeamMessageInput } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useSendTeamMessage() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useMutation({
    mutationFn: (input: SendTeamMessageInput) => teamMessages.send(businessId, input),
  });
}
