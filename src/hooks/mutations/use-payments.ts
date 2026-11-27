'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payments, type CreatePaymentInput } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import { AI_SUGGESTIONS_KEY } from '@/hooks/queries/use-ai-suggestions';
import { JOB_WORKFLOW_KEY } from '@/hooks/queries/use-jobs';

export function useCreatePayment() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePaymentInput) => payments.create(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments', businessId] });
      void queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
      // A deposit can unlock the job's "Start job" card and move its workflow stage.
      void queryClient.invalidateQueries({ queryKey: [AI_SUGGESTIONS_KEY, businessId] });
      void queryClient.invalidateQueries({ queryKey: [JOB_WORKFLOW_KEY, businessId] });
    },
  });
}

export function useDeletePayment() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => payments.delete(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments', businessId] });
      void queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
    },
  });
}
