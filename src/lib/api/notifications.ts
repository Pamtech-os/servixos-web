import type { PaginationMeta } from '@/lib/pagination';
import { protectedGet, protectedRequest } from './core';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Unknown future types render as a generic notification (title and body only). */
export type NotificationType = 'new_booking' | (string & {});

export interface NotificationView {
  id: string;
  type: NotificationType;
  /** Ready to show. */
  title: string;
  /** Ready to show. */
  body: string;
  data: {
    requestId: string | null;
    clientName: string | null;
    service: string | null;
    /** Calendar day at UTC midnight. */
    requestedDate: string | null;
  };
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsQuery {
  page?: number;
  /** 1–50, default 20. */
  limit?: number;
  unread?: boolean;
}

export interface NotificationsResult {
  data: NotificationView[];
  meta: PaginationMeta;
  /** The full unread total, whatever the page or filter. */
  unreadCount: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const notifications = {
  list: async (businessId: string, query: NotificationsQuery = {}): Promise<NotificationsResult> => {
    const params = new URLSearchParams();
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));
    if (query.unread != null) params.set('unread', String(query.unread));
    const qs = params.toString();

    const envelope = await protectedGet<NotificationView[]>(
      `/notifications${qs ? `?${qs}` : ''}`,
      businessId
    );
    return {
      data: envelope.data,
      meta: envelope.meta!,
      unreadCount: envelope.statistics?.unreadCount ?? 0,
    };
  },

  unreadCount: async (businessId: string): Promise<number> => {
    const envelope = await protectedGet<{ unreadCount: number }>(
      '/notifications/unread-count',
      businessId
    );
    return envelope.data.unreadCount;
  },

  markRead: (businessId: string, id: string): Promise<NotificationView> =>
    protectedRequest<NotificationView>('PATCH', `/notifications/${id}/read`, businessId),

  markAllRead: (businessId: string): Promise<{ updated: number }> =>
    protectedRequest<{ updated: number }>('PATCH', '/notifications/read-all', businessId),
};
