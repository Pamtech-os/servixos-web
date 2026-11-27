import { protectedRequest } from './core';
import type { ConceptRef, LearningMode } from './learning';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdvisorTopic = 'pricing' | 'marketing' | 'operations';

export interface AdvisorAnswer {
  inScope: boolean;
  topic: AdvisorTopic | null;
  title: string;
  answer: string;
  learningMode: LearningMode;
  /** Empty for out-of-scope answers. */
  concepts: ConceptRef[];
}

export interface AskAdvisorInput {
  question: string;
  topic?: AdvisorTopic;
}

// ─── API ──────────────────────────────────────────────────────────────────────

// A first question waits on an AI call (the API gives it up to 30 s), so the
// default 15 s request timeout aborted it while the server finished and cached
// the answer, which is why the retry then worked instantly.
const ADVISOR_TIMEOUT_MS = 45_000;

export const aiAdvisor = {
  ask: (businessId: string, input: AskAdvisorInput): Promise<AdvisorAnswer> =>
    protectedRequest<AdvisorAnswer>('POST', '/ai/advisor', businessId, input, {
      timeoutMs: ADVISOR_TIMEOUT_MS,
    }),
};
