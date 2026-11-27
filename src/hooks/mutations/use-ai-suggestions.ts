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
import { JOB_WORKFLOW_KEY } from '@/hooks/queries/use-jobs';
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

/**
 * Applies a card by id. The card need not be in the cached list yet: the "Review and send"
 * card that `next.suggestionId` names is created by the previous apply.
 */
export function useApplySuggestion() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();
  const queryKey = [AI_SUGGESTIONS_KEY, businessId];

  return useMutation({
    mutationFn: ({ id, draftValue }: { id: string; draftValue?: string }) =>
      aiSuggestions.apply(businessId, id, draftValue),
    onSuccess: (data, { id }) => {
      const cached = queryClient
        .getQueryData<SuggestionsResult>(queryKey)
        ?.suggestions.find((s) => s.id === id);

      if (data.status === 'completed' && cached) {
        markSuggestionCompleted(queryClient, businessId, cached, data.executedAt, data.remaining);
      } else if (data.status === 'executing' && cached) {
        // Emails confirm in the background; the execution watcher polls from here.
        queryClient.setQueryData<SuggestionsResult>(queryKey, (prev) =>
          patchSuggestion(prev, data.id, { status: 'executing', failure: null })
        );
      } else {
        // Not cached: the refetched list carries it as `executing` for the watcher, or not at all.
        void queryClient.invalidateQueries({ queryKey: [AI_SUGGESTIONS_TRACKED_KEY, businessId] });
        void queryClient.invalidateQueries({ queryKey: [AI_PRIORITIES_KEY, businessId] });
      }
      // A completed pipeline step creates the job's next card (and `next` may point at it).
      if (data.status === 'completed' && (data.next || cached?.category === 'job_workflow')) {
        void queryClient.invalidateQueries({ queryKey });
      } else if (!cached) {
        void queryClient.invalidateQueries({ queryKey });
      }
      const jobId = data.next?.jobId ?? cached?.references?.jobId;
      if (jobId) void queryClient.invalidateQueries({ queryKey: [JOB_WORKFLOW_KEY, businessId, jobId] });
    },
    onError: (err, { id }) => {
      if (!(err instanceof HttpError)) return;
      if (err.status === 404) {
        // The job moved past this step (e.g. done from the jobs page), so the card expired.
        queryClient.setQueryData<SuggestionsResult>(queryKey, (prev) => removeSuggestion(prev, id));
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
