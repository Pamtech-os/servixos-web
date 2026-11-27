'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { aiSuggestions, type Suggestion, type SuggestionDetail, type SuggestionsResult } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import { AI_SUGGESTIONS_KEY } from '@/hooks/queries/use-ai-suggestions';
import { markSuggestionCompleted, patchSuggestion } from '@/hooks/mutations/use-ai-suggestions';

const POLL_MS = 2_000;

interface ExecutionCallbacks {
  onCompleted: (suggestion: Suggestion) => void;
  onFailed: (suggestion: Suggestion, message: string) => void;
  onExpired: (suggestion: Suggestion) => void;
}

/**
 * Polls every `executing` card until the email is confirmed (completed), rejected (failed)
 * or the card expires, then moves it in the cache and reports the result once.
 */
export function useSuggestionExecution(suggestions: Suggestion[], callbacks: ExecutionCallbacks) {
  const { businessId, isReady } = useBusinessAuth();
  const queryClient = useQueryClient();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const executing = useMemo(() => suggestions.filter((s) => s.status === 'executing'), [suggestions]);

  const results = useQueries({
    queries: executing.map((s) => ({
      queryKey: ['ai-suggestion', businessId, s.id],
      queryFn: () => aiSuggestions.get(businessId, s.id),
      enabled: isReady,
      staleTime: 0,
      gcTime: 0,
      refetchInterval: (query: { state: { data?: SuggestionDetail } }) =>
        query.state.data && query.state.data.status !== 'executing' ? false : POLL_MS,
    })),
  });

  useEffect(() => {
    results.forEach(({ data }, i) => {
      const suggestion = executing[i];
      if (!data || !suggestion || data.status === 'executing') return;
      const listKey = [AI_SUGGESTIONS_KEY, businessId];

      // Each branch moves the card out of `executing`, so it is handled exactly once.
      if (data.status === 'completed') {
        markSuggestionCompleted(queryClient, businessId, suggestion, data.executedAt);
        callbacksRef.current.onCompleted(suggestion);
      } else if (data.status === 'failed') {
        queryClient.setQueryData<SuggestionsResult>(listKey, (prev) =>
          patchSuggestion(prev, suggestion.id, { status: 'failed', failure: data.failure })
        );
        callbacksRef.current.onFailed(
          suggestion,
          data.failure?.message ?? 'The action did not complete. Please try again.'
        );
      } else {
        // Dismissed or expired elsewhere: hide it now, then pull the fresh list.
        queryClient.setQueryData<SuggestionsResult>(listKey, (prev) =>
          patchSuggestion(prev, suggestion.id, { status: data.status })
        );
        void queryClient.invalidateQueries({ queryKey: listKey });
        callbacksRef.current.onExpired(suggestion);
      }
    });
  }, [results, executing, businessId, queryClient]);
}
