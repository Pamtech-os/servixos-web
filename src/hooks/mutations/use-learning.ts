'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  learning,
  type ConceptFeedbackRequest,
  type LearningPreferences,
  type LearnRequest,
  type UpdateLearningRequest,
} from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import { LEARNING_PREFERENCES_KEY } from '@/hooks/queries/use-learning';
import { AI_SUGGESTIONS_KEY } from '@/hooks/queries/use-ai-suggestions';
import { HttpError } from '@/common/network/http-client';

const UPDATE_LEARNING_KEY = ['update-learning-preferences'];

export function useUpdateLearningPreferences() {
  const { businessId } = useBusinessAuth();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = [LEARNING_PREFERENCES_KEY, businessId];

  // With quick successive taps, only the last PATCH in flight may write the cache;
  // an earlier response (or rollback) landing late would otherwise undo the newer choice.
  const isLastInFlight = () => queryClient.isMutating({ mutationKey: UPDATE_LEARNING_KEY }) <= 1;

  return useMutation({
    mutationKey: UPDATE_LEARNING_KEY,
    mutationFn: (input: UpdateLearningRequest) => learning.updatePreferences(businessId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<LearningPreferences>(queryKey);
      if (previous) queryClient.setQueryData<LearningPreferences>(queryKey, { ...previous, ...input });
      return { previous };
    },
    onError: (err, _input, context) => {
      if (context?.previous && isLastInFlight()) queryClient.setQueryData(queryKey, context.previous);
      if (err instanceof HttpError && err.status === 404) logout();
    },
    onSuccess: (saved, input) => {
      if (isLastInFlight()) queryClient.setQueryData(queryKey, saved);
      // Which cards carry education, and whether it starts open, depends on the mode.
      if (input.mode !== undefined) {
        void queryClient.invalidateQueries({ queryKey: [AI_SUGGESTIONS_KEY, businessId] });
      }
    },
  });
}

/** Every call is recorded as an explanation server-side: only fire on a user tap. */
export function useLearn() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LearnRequest) => learning.learn(businessId, input),
    onError: (err) => {
      if (err instanceof HttpError && err.status === 404) {
        void queryClient.invalidateQueries({ queryKey: [AI_SUGGESTIONS_KEY, businessId] });
      }
    },
  });
}

export function useConceptFeedback() {
  const { businessId } = useBusinessAuth();

  return useMutation({
    mutationFn: (input: ConceptFeedbackRequest) => learning.feedback(businessId, input),
  });
}
