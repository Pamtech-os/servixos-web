import { protectedGet } from './core';
import type { JobStatus } from './jobs';
import type { ActivityLogCategory } from './activity-logs';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyTrafficPoint {
  date: string;
  visitors: number;
  pageViews: number;
}

export interface TopPage {
  page: string;
  views: number;
  percentage: number;
}

export interface TrafficStats {
  totalVisitors: number;
  totalPageViews: number;
  dailyAverage: number;
  conversionRate: number;
}

export interface TrafficAnalytics {
  trafficData: DailyTrafficPoint[];
  topPages: TopPage[];
  stats: TrafficStats;
}

export interface TrafficQuery {
  dateFrom?: string;
  dateTo?: string;
}

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
  count: number;
}

export interface JobStatusPoint {
  status: JobStatus;
  count: number;
  percentage: number;
}

export interface AnalyticsRecentActivity {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  category: ActivityLogCategory;
  timestamp: string;
}

export interface TopClient {
  clientId: string;
  name: string;
  email: string;
  totalSpent: number;
}

export interface OutstandingInvoicesSummary {
  count: number;
  totalAmount: number;
}

export interface DashboardStats {
  monthlyRevenue: number;
  activeClientsCount: number;
  outstandingInvoices: OutstandingInvoicesSummary;
  reviewCount: number;
  recentActivity: AnalyticsRecentActivity[];
  topClients: TopClient[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const analytics = {
  traffic: async (businessId: string, query: TrafficQuery = {}): Promise<TrafficAnalytics> => {
    const params = new URLSearchParams();
    if (query.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params.set('dateTo', query.dateTo);
    const qs = params.toString();
    const path = `/analytics/traffic${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<TrafficAnalytics>(path, businessId);
    return envelope.data;
  },

  revenue: async (businessId: string, months?: number): Promise<MonthlyRevenuePoint[]> => {
    const params = new URLSearchParams();
    if (months != null) params.set('months', String(months));
    const qs = params.toString();
    const path = `/analytics/revenue${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<MonthlyRevenuePoint[]>(path, businessId);
    return envelope.data;
  },

  jobs: async (businessId: string): Promise<JobStatusPoint[]> => {
    const envelope = await protectedGet<JobStatusPoint[]>('/analytics/jobs', businessId);
    return envelope.data;
  },

  dashboard: async (businessId: string): Promise<DashboardStats> => {
    const envelope = await protectedGet<DashboardStats>('/analytics/dashboard', businessId);
    return envelope.data;
  },
};
