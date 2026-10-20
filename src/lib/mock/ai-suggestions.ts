// Temporary preview data for the Review & Execute flow — not backed by the API yet.

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

export const MOCK_SUGGESTIONS: ReviewableSuggestion[] = [
  {
    id: 'mock-overdue-invoice-1042',
    category: 'cash_flow',
    title: 'Invoice #1042 is 12 days overdue',
    description:
      'This customer typically pays within 5 days. The delay could signal a cash flow issue worth addressing now.',
    recommendation: 'Send a friendly payment reminder with a 3-day grace period.',
    trackedOutcome: 'paid 2 days later.',
    review: {
      heading: 'Payment reminder',
      details: [
        { label: 'Customer', value: 'Adaeze Okafor' },
        { label: 'Invoice', value: '#1042' },
        { label: 'Days overdue', value: '12' },
        { label: 'New due date', value: '3 days from today' },
        { label: 'Channel', value: 'Email' },
      ],
      draft: {
        label: 'Reminder message',
        value:
          "Hi Adaeze,\n\nJust a friendly reminder that Invoice #1042 is now past due. We've extended the due date by 3 days to give you some extra time. Let us know if you have any questions.\n\nThank you!",
        multiline: true,
      },
      executeLabel: 'Send reminder',
      successMessage: 'Payment reminder sent for Invoice #1042.',
    },
  },
  {
    id: 'mock-logo-design-pricing',
    category: 'pricing',
    title: "Your 'Logo Design' service is priced below similar jobs",
    description:
      "Comparable jobs you've completed closed higher. You may be leaving money on the table.",
    recommendation: 'Review a suggested price adjustment for this service.',
    trackedOutcome: '2 new quotes accepted at the updated price.',
    review: {
      heading: 'Price adjustment',
      details: [
        { label: 'Service', value: 'Logo Design' },
        { label: 'Current price', value: '350' },
        { label: 'Average of similar jobs', value: '465' },
        { label: 'Applies to', value: 'New quotes and invoices only' },
      ],
      draft: { label: 'New price', value: '450', multiline: false },
      executeLabel: 'Update price',
      successMessage: "'Logo Design' price updated.",
    },
  },
  {
    id: 'mock-repeat-customers-checkin',
    category: 'customer_retention',
    title: "3 repeat customers haven't booked in 60+ days",
    description: 'Customers who go quiet for two months rarely come back without a nudge.',
    recommendation: 'Send a personalized check-in message to each customer.',
    trackedOutcome: '2 of 3 customers replied and 1 booked a new job.',
    review: {
      heading: 'Check-in messages',
      details: [
        { label: 'Tunde Bakare', value: 'Last booked 64 days ago' },
        { label: 'Chioma Eze', value: 'Last booked 71 days ago' },
        { label: 'Ibrahim Musa', value: 'Last booked 88 days ago' },
      ],
      draft: {
        label: 'Message template',
        value:
          "Hi {first_name},\n\nIt's been a while! We'd love to help with your next project. Reply to this message to book a time that works for you.",
        multiline: true,
      },
      executeLabel: 'Send 3 messages',
      successMessage: 'Check-in messages sent to 3 customers.',
    },
  },
];
