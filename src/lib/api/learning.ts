import { protectedGet, protectedRequest } from './core';
import type { SuggestionStatus } from './ai-suggestions';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LearningMode = 'teach_me' | 'guide_me' | 'do_it_for_me';
export type BusinessExperience = 'new' | 'growing' | 'experienced';

export type ConceptKey =
  | 'cash_flow'
  | 'pricing_strategy'
  | 'profit_margin'
  | 'revenue_goals'
  | 'customer_retention'
  | 'customer_acquisition'
  | 'reputation'
  | 'operational_efficiency';

/** Analytics only: never render as a score, level or badge. */
export type ConceptFamiliarity = 'new' | 'introduced' | 'struggling' | 'practicing' | 'confident';

export interface ConceptRef {
  key: ConceptKey;
  name: string;
}

export interface LearningPreferences {
  mode: LearningMode;
  experience: BusinessExperience | null;
}

export interface UpdateLearningRequest {
  mode?: LearningMode;
  /** `null` clears it so the AI infers experience from the onboarding profile. */
  experience?: BusinessExperience | null;
}

export interface SuggestionEducation {
  concept: ConceptRef;
  whyItMatters: string;
  principle: string;
  familiarity: ConceptFamiliarity;
  defaultExpanded: boolean;
}

/** Either `suggestionId` or `concept` fixes the subject of a Learn More thread. */
export type LearnSubject =
  | { suggestionId: string; concept?: undefined }
  | { suggestionId?: undefined; concept: ConceptKey };

export type LearnRequest = LearnSubject & {
  /** 1–500 chars; follow-ups only. */
  question?: string;
};

export interface LearnSuggestionRef {
  id: string;
  title: string;
  status: SuggestionStatus;
  canExecute: boolean;
  executeLabel: string;
}

export interface LearnAnswer {
  concept: ConceptRef;
  title: string;
  /** Plain text with line breaks; not Markdown. */
  answer: string;
  principle: string;
  watchFor: string;
  followUps: string[];
  familiarity: ConceptFamiliarity;
  learningMode: LearningMode;
  suggestion: LearnSuggestionRef | null;
}

export interface ConceptFeedbackRequest {
  concept: ConceptKey;
  understood: boolean;
}

export interface ConceptFeedbackResult {
  concept: ConceptRef;
  familiarity: ConceptFamiliarity;
}

export const LEARN_QUESTION_MAX_LENGTH = 500;

// A fresh explanation waits on the AI; cached repeats return fast.
const LEARN_TIMEOUT_MS = 45_000;

// ─── API ──────────────────────────────────────────────────────────────────────

export const learning = {
  getPreferences: async (businessId: string): Promise<LearningPreferences> => {
    const envelope = await protectedGet<LearningPreferences>('/settings/learning', businessId);
    return envelope.data;
  },

  updatePreferences: (
    businessId: string,
    input: UpdateLearningRequest
  ): Promise<LearningPreferences> =>
    protectedRequest<LearningPreferences>('PATCH', '/settings/learning', businessId, input),

  learn: (businessId: string, input: LearnRequest): Promise<LearnAnswer> =>
    protectedRequest<LearnAnswer>('POST', '/ai/advisor/learn', businessId, input, {
      timeoutMs: LEARN_TIMEOUT_MS,
    }),

  feedback: (businessId: string, input: ConceptFeedbackRequest): Promise<ConceptFeedbackResult> =>
    protectedRequest<ConceptFeedbackResult>(
      'POST',
      '/ai/advisor/learn/feedback',
      businessId,
      input
    ),
};
