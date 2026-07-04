import { protectedGet, protectedRequest } from './core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SuggestionTag = 'quick_win' | 'suggested' | 'high_impact';

export type SuggestionId =
  | 'client-follow-ups'
  | 'complete-stale-jobs'
  | 'set-revenue-target'
  | 'send-payment-reminders'
  | 'optimize-pricing';

export interface Suggestion {
  id: SuggestionId;
  text: string;
  tag: SuggestionTag;
}

export interface SuggestionsResult {
  count: number;
  suggestions: Suggestion[];
}

export interface ApplySuggestionResult {
  id: SuggestionId;
  summary: string;
  remaining: number;
}

export interface DismissSuggestionResult {
  id: SuggestionId;
  remaining: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const aiSuggestions = {
  list: async (businessId: string): Promise<SuggestionsResult> => {
    const envelope = await protectedGet<SuggestionsResult>('/ai/suggestions', businessId);
    return envelope.data;
  },

  apply: (businessId: string, id: SuggestionId): Promise<ApplySuggestionResult> =>
    protectedRequest<ApplySuggestionResult>(
      'POST',
      `/ai/suggestions/${id}/apply`,
      businessId
    ),

  dismiss: (businessId: string, id: SuggestionId): Promise<DismissSuggestionResult> =>
    protectedRequest<DismissSuggestionResult>(
      'POST',
      `/ai/suggestions/${id}/dismiss`,
      businessId
    ),
};
