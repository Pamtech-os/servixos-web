'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  aiSuggestions,
  type Suggestion,
  type SuggestionsResult,
  type TrackedSuggestionsResult,
} from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import {
  AI_SUGGESTIONS_KEY,
  AI_SUGGESTIONS_TRACKED_KEY,
} from '@/hooks/queries/use-ai-suggestions';
import { HttpError } from '@/common/network/http-client';

function removeSuggestion(
  prev: SuggestionsResult | undefined,
  id: string,
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
  const trackedKey = [AI_SUGGESTIONS_TRACKED_KEY, businessId];

  return useMutation({
    mutationFn: ({ suggestion, draftValue }: { suggestion: Suggestion; draftValue?: string }) =>
      aiSuggestions.apply(businessId, suggestion.id, draftValue),
    onSuccess: (data, { suggestion }) => {
      queryClient.setQueryData<SuggestionsResult>(queryKey, (prev) =>
        removeSuggestion(prev, data.id, data.remaining)
      );
      queryClient.setQueryData<TrackedSuggestionsResult>(trackedKey, (prev) => ({
        tracked: [
          {
            id: data.id,
            category: suggestion.category,
            title: suggestion.title,
            executeLabel: suggestion.review.executeLabel,
            executedAt: data.executedAt,
            outcome: null,
          },
          ...(prev?.tracked.filter((t) => t.id !== data.id) ?? []),
        ],
      }));
    },
    onError: (err, { suggestion }) => {
      if (err instanceof HttpError && err.status === 404) {
        queryClient.setQueryData<SuggestionsResult>(queryKey, (prev) =>
          removeSuggestion(prev, suggestion.id)
        );
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
    mutationFn: (id: string) => aiSuggestions.dismiss(businessId, id),
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
