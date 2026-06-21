import { protectedGet } from './core';
import type { PaginationMeta } from '@/lib/pagination';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityLogCategory =
  | 'auth'
  | 'client'
  | 'job'
  | 'invoice'
  | 'payment'
  | 'settings'
  | 'role'
  | 'employee'
  | 'task'
  | 'request'
  | 'website';

export interface ActivityLog {
  _id: string;
  businessId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  category: ActivityLogCategory;
  resourceId?: string;
  resourceType?: string;
  ipAddress?: string;
  userAgent?: string;
  city?: string;
  country?: string;
  timestamp: string;
  createdAt: string;
}

export interface ActivityLogsQuery {
  search?: string;
  category?: ActivityLogCategory;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const activityLogs = {
  list: async (
    businessId: string,
    query: ActivityLogsQuery = {}
  ): Promise<{ data: ActivityLog[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.category) params.set('category', query.category);
    if (query.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params.set('dateTo', query.dateTo);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/activity-logs${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<ActivityLog[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },
};
