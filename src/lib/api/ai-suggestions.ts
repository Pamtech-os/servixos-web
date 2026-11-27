import { protectedGet, protectedRequest } from './core';
import type { SuggestionEducation } from './learning';

// ─── Types ────────────────────────────────────────────────────────────────────

/** `job_workflow` cards drive an accepted booking from contract to job start. */
export type SuggestionCategory = 'cash_flow' | 'pricing' | 'customer_retention' | 'job_workflow';

/** `review_contract` opens the contract review instead of applying straight away. */
export type SuggestionAction = 'execute' | 'review_contract';

export interface SuggestionReferences {
  jobId: string | null;
  contractId: string | null;
  invoiceId: string | null;
  clientId: string | null;
}

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

/**
 * pending_review → executing → completed | failed (retryable). Email actions sit in
 * `executing` until the mail provider accepts the message.
 */
export type SuggestionStatus =
  | 'pending_review'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'dismissed'
  | 'expired';

export type SuggestionPriority = 'high' | 'medium' | 'low';

export type SuggestionFailureCode =
  | 'client_unavailable'
  | 'pdf_failed'
  | 'email_rejected'
  | 'timed_out'
  | 'unexpected';

export interface SuggestionFailure {
  code: SuggestionFailureCode;
  /** User-facing; show as is. */
  message: string;
}

export interface Suggestion {
  id: string;
  category: SuggestionCategory;
  action: SuggestionAction;
  references: SuggestionReferences;
  status: SuggestionStatus;
  priority: SuggestionPriority;
  score: number;
  title: string;
  description: string;
  recommendation: string;
  review: SuggestionReview;
  failure: SuggestionFailure | null;
  /** Depends on the viewer, not the business; null means no "Why this matters" section. */
  education: SuggestionEducation | null;
}

export type OutcomeStatus = 'pending' | 'achieved' | 'partial' | 'not_achieved' | 'not_applicable';

export interface SuggestionDetail extends Omit<Suggestion, 'category'> {
  category?: SuggestionCategory;
  executedAt: string | null;
  outcome: string | null;
  outcomeStatus: OutcomeStatus | null;
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
  outcomeStatus?: OutcomeStatus;
}

export interface TrackedSuggestionsResult {
  tracked: TrackedSuggestion[];
}

export interface ApplySuggestionNext {
  type: 'review_contract';
  jobId: string;
  contractId: string;
  /** The "Review and send" card; null if it could not be created. */
  suggestionId: string | null;
}

export interface ApplySuggestionResult {
  id: string;
  /** `executing` for emails (poll until settled); `completed` for instant actions. */
  status: 'executing' | 'completed';
  remaining: number;
  executedAt: string | null;
  /** Where to go after this step, e.g. review the contract that was just drafted. */
  next?: ApplySuggestionNext | null;
}

export type DismissReason = 'already_handled' | 'not_now' | 'not_relevant' | 'incorrect' | 'other';

export interface DismissSuggestionInput {
  reason?: DismissReason;
  /** Up to 500 characters. */
  note?: string;
}

export interface DismissSuggestionResult {
  id: string;
  remaining: number;
}

// The backend waits for AI-written copy when suggestions are new; worst case ~1 min.
const SUGGESTIONS_LIST_TIMEOUT_MS = 75_000;
// "Generate contract" drafts the contract with AI before it returns.
const APPLY_TIMEOUT_MS = 60_000;

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

  get: async (businessId: string, id: string): Promise<SuggestionDetail> => {
    const envelope = await protectedGet<SuggestionDetail>(`/ai/suggestions/${id}`, businessId);
    return envelope.data;
  },

  apply: (businessId: string, id: string, draftValue?: string): Promise<ApplySuggestionResult> =>
    protectedRequest<ApplySuggestionResult>(
      'POST',
      `/ai/suggestions/${id}/apply`,
      businessId,
      draftValue === undefined ? {} : { draftValue },
      { timeoutMs: APPLY_TIMEOUT_MS }
    ),

  dismiss: (
    businessId: string,
    id: string,
    input: DismissSuggestionInput = {}
  ): Promise<DismissSuggestionResult> =>
    protectedRequest<DismissSuggestionResult>(
      'POST',
      `/ai/suggestions/${id}/dismiss`,
      businessId,
      input.reason ? input : undefined
    ),
};
