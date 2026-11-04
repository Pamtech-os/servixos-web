'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications, type NotificationsResult } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import { NOTIFICATIONS_KEY, NOTIFICATIONS_UNREAD_KEY } from '@/hooks/queries/use-notifications';

export function useMarkNotificationRead() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();
  const listKey = [NOTIFICATIONS_KEY, businessId];
  const unreadKey = [NOTIFICATIONS_UNREAD_KEY, businessId];

  return useMutation({
    mutationFn: (id: string) => notifications.markRead(businessId, id),
    // Optimistic: the badge drops the moment the user opens the notification.
    onMutate: (id) => {
      const list = queryClient.getQueryData<NotificationsResult>(listKey);
      const wasUnread = list?.data.find((n) => n.id === id)?.readAt == null;
      queryClient.setQueryData<NotificationsResult>(listKey, (prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)),
            }
          : prev
      );
      if (wasUnread) queryClient.setQueryData<number>(unreadKey, (prev) => Math.max((prev ?? 1) - 1, 0));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: unreadKey });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();
  const listKey = [NOTIFICATIONS_KEY, businessId];
  const unreadKey = [NOTIFICATIONS_UNREAD_KEY, businessId];

  return useMutation({
    mutationFn: () => notifications.markAllRead(businessId),
    onMutate: () => {
      const now = new Date().toISOString();
      queryClient.setQueryData<NotificationsResult>(listKey, (prev) =>
        prev ? { ...prev, unreadCount: 0, data: prev.data.map((n) => ({ ...n, readAt: n.readAt ?? now })) } : prev
      );
      queryClient.setQueryData<number>(unreadKey, 0);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: unreadKey });
    },
  });
}
