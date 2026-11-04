'use client';

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  aiSuggestions,
  type DismissSuggestionInput,
  type Suggestion,
  type SuggestionsResult,
  type TrackedSuggestionsResult,
} from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import {
  AI_SUGGESTIONS_KEY,
  AI_SUGGESTIONS_TRACKED_KEY,
} from '@/hooks/queries/use-ai-suggestions';
import { AI_PRIORITIES_KEY } from '@/hooks/queries/use-ai-priorities';
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

export function patchSuggestion(
  prev: SuggestionsResult | undefined,
  id: string,
  patch: Partial<Suggestion>
): SuggestionsResult | undefined {
  if (!prev) return prev;
  return {
    ...prev,
    suggestions: prev.suggestions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  };
}

/** Moves a completed suggestion from the open list to the Tracked list. */
export function markSuggestionCompleted(
  queryClient: QueryClient,
  businessId: string,
  suggestion: Suggestion,
  executedAt: string | null,
  remaining?: number
) {
  queryClient.setQueryData<SuggestionsResult>([AI_SUGGESTIONS_KEY, businessId], (prev) =>
    removeSuggestion(prev, suggestion.id, remaining)
  );
  queryClient.setQueryData<TrackedSuggestionsResult>([AI_SUGGESTIONS_TRACKED_KEY, businessId], (prev) => ({
    tracked: [
      {
        id: suggestion.id,
        category: suggestion.category,
        title: suggestion.title,
        executeLabel: suggestion.review.executeLabel,
        executedAt: executedAt ?? new Date().toISOString(),
        outcome: null,
        outcomeStatus: 'pending',
      },
      ...(prev?.tracked.filter((t) => t.id !== suggestion.id) ?? []),
    ],
  }));
  void queryClient.invalidateQueries({ queryKey: [AI_PRIORITIES_KEY, businessId] });
}

export function useApplySuggestion() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();
  const queryKey = [AI_SUGGESTIONS_KEY, businessId];

  return useMutation({
    mutationFn: ({ suggestion, draftValue }: { suggestion: Suggestion; draftValue?: string }) =>
      aiSuggestions.apply(businessId, suggestion.id, draftValue),
    onSuccess: (data, { suggestion }) => {
      if (data.status === 'completed') {
        markSuggestionCompleted(queryClient, businessId, suggestion, data.executedAt, data.remaining);
        return;
      }
      // Emails confirm in the background; the execution watcher polls from here.
      queryClient.setQueryData<SuggestionsResult>(queryKey, (prev) =>
        patchSuggestion(prev, data.id, { status: 'executing', failure: null })
      );
    },
    onError: (err, { suggestion }) => {
      if (!(err instanceof HttpError)) return;
      if (err.status === 404) {
        queryClient.setQueryData<SuggestionsResult>(queryKey, (prev) =>
          removeSuggestion(prev, suggestion.id)
        );
        void queryClient.invalidateQueries({ queryKey });
      } else if (err.status >= 500) {
        // An instant action failed and the card is now `failed`; pull its failure message.
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
    mutationFn: ({ id, input }: { id: string; input?: DismissSuggestionInput }) =>
      aiSuggestions.dismiss(businessId, id, input),
    onSuccess: (data) => {
      queryClient.setQueryData<SuggestionsResult>(queryKey, (prev) =>
        removeSuggestion(prev, data.id, data.remaining)
      );
      void queryClient.invalidateQueries({ queryKey: [AI_PRIORITIES_KEY, businessId] });
    },
    onError: (err, { id }) => {
      if (err instanceof HttpError && err.status === 404) {
        queryClient.setQueryData<SuggestionsResult>(queryKey, (prev) => removeSuggestion(prev, id));
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
