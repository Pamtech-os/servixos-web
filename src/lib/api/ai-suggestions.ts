import { protectedGet, protectedRequest } from './core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SuggestionCategory = 'cash_flow' | 'pricing' | 'customer_retention';

export interface SuggestionDetail {
  label: string;
  value: string;
}

export interface SuggestionDraft {
  label: string;
  value: string;
  multiline: boolean;
}

export interface SuggestionReview {
  heading: string;
  details: SuggestionDetail[];
  draft?: SuggestionDraft;
  executeLabel: string;
  successMessage: string;
}

export interface Suggestion {
  id: string;
  category: SuggestionCategory;
  title: string;
  description: string;
  recommendation: string;
  review: SuggestionReview;
}

export interface SuggestionsResult {
  count: number;
  suggestions: Suggestion[];
}

export interface TrackedSuggestion {
  id: string;
  category: SuggestionCategory;
  title: string;
  executeLabel: string;
  executedAt: string;
  outcome: string | null;
}

export interface TrackedSuggestionsResult {
  tracked: TrackedSuggestion[];
}

export interface ApplySuggestionResult {
  id: string;
  remaining: number;
  executedAt: string;
}

export interface DismissSuggestionResult {
  id: string;
  remaining: number;
}

// The backend waits for AI-written copy when suggestions are new; worst case ~1 min.
const SUGGESTIONS_LIST_TIMEOUT_MS = 75_000;

// ─── API ──────────────────────────────────────────────────────────────────────

export const aiSuggestions = {
  list: async (businessId: string): Promise<SuggestionsResult> => {
    const envelope = await protectedGet<SuggestionsResult>('/ai/suggestions', businessId, {
      timeoutMs: SUGGESTIONS_LIST_TIMEOUT_MS,
    });
    return envelope.data;
  },

  tracked: async (businessId: string): Promise<TrackedSuggestionsResult> => {
    const envelope = await protectedGet<TrackedSuggestionsResult>(
      '/ai/suggestions/tracked',
      businessId
    );
    return envelope.data;
  },

  apply: (businessId: string, id: string, draftValue?: string): Promise<ApplySuggestionResult> =>
    protectedRequest<ApplySuggestionResult>(
      'POST',
      `/ai/suggestions/${id}/apply`,
      businessId,
      draftValue === undefined ? {} : { draftValue }
    ),

  dismiss: (businessId: string, id: string): Promise<DismissSuggestionResult> =>
    protectedRequest<DismissSuggestionResult>(
      'POST',
      `/ai/suggestions/${id}/dismiss`,
      businessId
    ),
};
