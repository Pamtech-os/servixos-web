import { protectedGet } from './core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InsightCategory = 'revenue' | 'clients' | 'operations' | 'growth';
export type InsightSeverity = 'high' | 'medium' | 'low';

export interface InsightAction {
  label: string;
  link: string;
}

export interface Insight {
  id: string;
  category: InsightCategory;
  title: string;
  description: string;
  severity: InsightSeverity;
  action?: InsightAction;
}

export interface InsightCategorySummary {
  key: InsightCategory;
  label: string;
  count: number;
}

export interface InsightsResult {
  categories: InsightCategorySummary[];
  insights: Insight[];
}

export interface InsightsQuery {
  category?: InsightCategory;
  severity?: InsightSeverity;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const aiInsights = {
  list: async (businessId: string, query: InsightsQuery = {}): Promise<InsightsResult> => {
    const params = new URLSearchParams();
    if (query.category) params.set('category', query.category);
    if (query.severity) params.set('severity', query.severity);
    const qs = params.toString();
    const path = `/ai/insights${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<InsightsResult>(path, businessId);
    return envelope.data;
  },
};
