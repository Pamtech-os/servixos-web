import { protectedGet } from './core';
import type { SuggestionPriority } from './ai-suggestions';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PriorityItemType = 'suggestion' | 'task' | 'request';

export type PriorityActionType = 'review_suggestion' | 'open_task' | 'view_request';

export interface PriorityItem {
  /** Stable across refreshes, e.g. "task:6729…"; use as the React key. */
  id: string;
  type: PriorityItemType;
  priority: SuggestionPriority;
  score: number;
  title: string;
  why: string;
  evidence: Array<{ label: string; value: string }>;
  action: { type: PriorityActionType; targetId: string; label: string };
}

export interface PrioritiesResult {
  date: string;
  headline: string;
  totalOpen: number;
  items: PriorityItem[];
}

// The first load after new data waits while suggestion copy is written.
const PRIORITIES_TIMEOUT_MS = 75_000;

// ─── API ──────────────────────────────────────────────────────────────────────

export const aiPriorities = {
  get: async (businessId: string): Promise<PrioritiesResult> => {
    const envelope = await protectedGet<PrioritiesResult>('/ai/priorities', businessId, {
      timeoutMs: PRIORITIES_TIMEOUT_MS,
    });
    return envelope.data;
  },
};
