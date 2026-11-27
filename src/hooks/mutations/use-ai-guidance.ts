'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '@/common/network/http-client';
import { aiGuidance, type GuidanceResult, type GuidanceStep, type GuidanceStepStatus } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import { AI_GUIDANCE_KEY } from '@/hooks/queries/use-ai-guidance';

// A step can appear in both nextSteps and plan.steps, so both copies are swapped.
function replaceStep(prev: GuidanceResult | undefined, step: GuidanceStep): GuidanceResult | undefined {
  if (!prev) return prev;
  const swap = (steps: GuidanceStep[]) => steps.map((s) => (s.id === step.id ? step : s));
  return {
    ...prev,
    nextSteps: swap(prev.nextSteps),
    plan: prev.plan && { ...prev.plan, steps: swap(prev.plan.steps) },
  };
}

const isGone = (err: unknown) => err instanceof HttpError && err.status === 404;

export function useUpdateGuidanceStep() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();
  const queryKey = [AI_GUIDANCE_KEY, businessId];

  return useMutation({
    mutationFn: ({ stepId, status }: { stepId: string; status: GuidanceStepStatus }) =>
      aiGuidance.updateStep(businessId, stepId, status),
    onSuccess: (step) => {
      queryClient.setQueryData<GuidanceResult>(queryKey, (prev) => replaceStep(prev, step));
      // Next steps are assembled server-side; refetch to pull the next one in.
      void queryClient.invalidateQueries({ queryKey });
    },
    // The step was dropped by a plan rewrite.
    onError: (err) => {
      if (isGone(err)) void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useCreateGuidanceTask() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();
  const queryKey = [AI_GUIDANCE_KEY, businessId];

  return useMutation({
    mutationFn: (stepId: string) => aiGuidance.createTask(businessId, stepId),
    onSuccess: ({ stepId, taskId }) => {
      queryClient.setQueryData<GuidanceResult>(queryKey, (prev) => {
        const step = [...(prev?.nextSteps ?? []), ...(prev?.plan?.steps ?? [])].find((s) => s.id === stepId);
        return step ? replaceStep(prev, { ...step, taskId }) : prev;
      });
    },
    onError: (err) => {
      if (isGone(err)) void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useRegenerateGuidancePlan() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();
  const queryKey = [AI_GUIDANCE_KEY, businessId];

  const markGenerating = () => {
    queryClient.setQueryData<GuidanceResult>(queryKey, (prev) =>
      prev?.plan ? { ...prev, plan: { ...prev.plan, status: 'generating' } } : prev
    );
    // Covers `plan: null`, which has no status to flip locally.
    void queryClient.invalidateQueries({ queryKey });
  };

  return useMutation({
    mutationFn: () => aiGuidance.regeneratePlan(businessId),
    onSuccess: markGenerating,
    // 409: a rewrite is already running, so start polling it.
    onError: (err) => {
      if (err instanceof HttpError && err.status === 409) markGenerating();
    },
  });
}
