'use client';

import { useMutation } from '@tanstack/react-query';
import { teamMessages, type SendTeamMessageInput } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useSendTeamMessage() {
  const { businessId } = useBusinessAuth();

  return useMutation({
    mutationFn: (input: SendTeamMessageInput) => teamMessages.send(businessId, input),
  });
}
