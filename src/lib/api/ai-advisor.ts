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

export const aiAdvisor = {
  ask: (businessId: string, input: AskAdvisorInput): Promise<AdvisorAnswer> =>
    protectedRequest<AdvisorAnswer>('POST', '/ai/advisor', businessId, input),
};
