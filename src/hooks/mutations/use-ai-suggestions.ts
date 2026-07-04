'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiSuggestions, type SuggestionId, type SuggestionsResult } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import { AI_SUGGESTIONS_KEY } from '@/hooks/queries/use-ai-suggestions';
import { HttpError } from '@/common/network/http-client';

function removeSuggestion(
  prev: SuggestionsResult | undefined,
  id: SuggestionId,
  remaining?: number
): SuggestionsResult | undefined {
  if (!prev) return prev;
  return {
    count: remaining ?? Math.max(prev.count - 1, 0),
    suggestions: prev.suggestions.filter((s) => s.id !== id),
  };
}

export function useApplySuggestion() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();
  const queryKey = [AI_SUGGESTIONS_KEY, businessId];

  return useMutation({
    mutationFn: (id: SuggestionId) => aiSuggestions.apply(businessId, id),
    onSuccess: (data) => {
      queryClient.setQueryData<SuggestionsResult>(queryKey, (prev) =>
        removeSuggestion(prev, data.id, data.remaining)
      );
    },
    onError: (err, id) => {
      if (err instanceof HttpError && err.status === 404) {
        queryClient.setQueryData<SuggestionsResult>(queryKey, (prev) => removeSuggestion(prev, id));
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}

export function useDismissSuggestion() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();
  const queryKey = [AI_SUGGESTIONS_KEY, businessId];

  return useMutation({
    mutationFn: (id: SuggestionId) => aiSuggestions.dismiss(businessId, id),
    onSuccess: (data) => {
      queryClient.setQueryData<SuggestionsResult>(queryKey, (prev) =>
        removeSuggestion(prev, data.id, data.remaining)
      );
    },
    onError: (err, id) => {
      if (err instanceof HttpError && err.status === 404) {
        queryClient.setQueryData<SuggestionsResult>(queryKey, (prev) => removeSuggestion(prev, id));
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
