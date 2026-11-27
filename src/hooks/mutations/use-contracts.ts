'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  contracts,
  jobs,
  type CreateContractInput,
  type UpdateContractInput,
} from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import { AI_SUGGESTIONS_KEY } from '@/hooks/queries/use-ai-suggestions';
import { JOB_WORKFLOW_KEY } from '@/hooks/queries/use-jobs';

export function useCreateContract() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateContractInput) => contracts.create(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contracts', businessId] });
    },
  });
}

export function useUpdateContract() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateContractInput }) =>
      contracts.update(businessId, id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contracts', businessId] });
    },
  });
}

export function useDeleteContract() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contracts.delete(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contracts', businessId] });
    },
  });
}

/**
 * Sends a job's contract with a signing link (POST /jobs/:id/contract/send). The contract is
 * marked sent only once the mail provider accepts the email.
 */
export function useSendJobContract() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => jobs.sendContract(businessId, jobId),
    onSuccess: (_result, jobId) => {
      void queryClient.invalidateQueries({ queryKey: ['contracts', businessId] });
      void queryClient.invalidateQueries({ queryKey: [JOB_WORKFLOW_KEY, businessId, jobId] });
      void queryClient.invalidateQueries({ queryKey: [AI_SUGGESTIONS_KEY, businessId] });
    },
  });
}

export function useGetContractPdf() {
  const { businessId } = useBusinessAuth();

  return useMutation({
    mutationFn: (id: string) => contracts.getPdf(businessId, id),
  });
}
