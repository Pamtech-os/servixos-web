export type SuggestionCategory = 'cash_flow' | 'pricing' | 'customer_retention';

export interface SuggestionDraft {
  label: string;
  value: string;
  multiline: boolean;
}

export interface ReviewableSuggestion {
  id: string;
  category: SuggestionCategory;
  title: string;
  description: string;
  recommendation: string;
  trackedOutcome: string;
  review: {
    heading: string;
    details: { label: string; value: string }[];
    draft?: SuggestionDraft;
    executeLabel: string;
    successMessage: string;
  };
}

export interface TrackedSuggestion {
  suggestion: ReviewableSuggestion;
  executedAt: number;
  executedDraft?: string;
}

export const SUGGESTION_CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  cash_flow: 'Cash flow',
  pricing: 'Pricing',
  customer_retention: 'Customer retention',
};
