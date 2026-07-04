'use client';

import { useMutation } from '@tanstack/react-query';
import { aiAdvisor, type AskAdvisorInput } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useAskAdvisor() {
  const { businessId } = useBusinessAuth();

  return useMutation({
    mutationFn: (input: AskAdvisorInput) => aiAdvisor.ask(businessId, input),
  });
}
