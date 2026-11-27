'use client';

import { useQuery } from '@tanstack/react-query';
import { notifications } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export const NOTIFICATIONS_KEY = 'notifications';
export const NOTIFICATIONS_UNREAD_KEY = 'notifications-unread';

const LIST_LIMIT = 20;

/** The newest notifications for the bell; loaded when the bell is opened. */
export function useNotifications(enabled: boolean) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, businessId],
    queryFn: () => notifications.list(businessId, { limit: LIST_LIMIT }),
    enabled: isReady && enabled,
    staleTime: 0,
  });
}

export function useUnreadNotificationCount() {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: [NOTIFICATIONS_UNREAD_KEY, businessId],
    queryFn: () => notifications.unreadCount(businessId),
    enabled: isReady,
  });
}
