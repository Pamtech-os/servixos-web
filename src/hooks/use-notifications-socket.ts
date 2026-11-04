'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import {
  createSocketAuthHeaders,
  getSocketAuthPayload,
  SOCKET_BASE_URL,
  socketAuth,
  type NotificationsResult,
  type NotificationView,
} from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import { NOTIFICATIONS_KEY, NOTIFICATIONS_UNREAD_KEY } from '@/hooks/queries/use-notifications';
import { AI_PRIORITIES_KEY } from '@/hooks/queries/use-ai-priorities';

const SERVER_DISCONNECT_RETRY_MS = 5_000;

/**
 * Keeps an app-wide /chat connection for `notification_created`, updates the bell's cache
 * and hands each new notification to `onNotification` exactly once.
 */
export function useNotificationsSocket(onNotification: (notification: NotificationView) => void) {
  const { businessId, isReady } = useBusinessAuth();
  const queryClient = useQueryClient();
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  useEffect(() => {
    if (!isReady) return;

    let active = true;
    let socket: Socket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    // Every open tab of this user receives the event; ids guard against duplicate deliveries.
    const seen = new Set<string>();
    const listKey = [NOTIFICATIONS_KEY, businessId];
    const unreadKey = [NOTIFICATIONS_UNREAD_KEY, businessId];

    async function connect() {
      let authPayload;
      try {
        authPayload = await getSocketAuthPayload(businessId);
      } catch {
        if (active) retryTimer = setTimeout(() => void connect(), SERVER_DISCONNECT_RETRY_MS);
        return;
      }
      if (!active) return;
      const headers = createSocketAuthHeaders(authPayload);

      socket = io(`${SOCKET_BASE_URL}/chat`, {
        transports: ['websocket', 'polling'],
        auth: socketAuth(businessId),
        extraHeaders: headers,
        transportOptions: { polling: { extraHeaders: headers } },
        withCredentials: true,
      });

      socket.on('notification_created', ({ notification }: { notification: NotificationView }) => {
        if (!notification?.id || seen.has(notification.id)) return;
        seen.add(notification.id);

        queryClient.setQueryData<number>(unreadKey, (prev) => (prev ?? 0) + 1);
        queryClient.setQueryData<NotificationsResult>(listKey, (prev) =>
          prev ? { ...prev, unreadCount: prev.unreadCount + 1, data: [notification, ...prev.data] } : prev
        );
        if (notification.type === 'new_booking') {
          void queryClient.invalidateQueries({ queryKey: ['requests', businessId] });
          void queryClient.invalidateQueries({ queryKey: [AI_PRIORITIES_KEY, businessId] });
        }
        onNotificationRef.current(notification);
      });

      // Events sent while disconnected are not replayed, so resync on every reconnect.
      let isInitialConnect = true;
      socket.on('connect', () => {
        if (isInitialConnect) {
          isInitialConnect = false;
          return;
        }
        void queryClient.invalidateQueries({ queryKey: unreadKey });
        void queryClient.invalidateQueries({ queryKey: listKey });
      });

      // A server-side disconnect (e.g. a rejected handshake) turns off socket.io's own
      // reconnection, so retry manually; each attempt fetches a fresh socket token.
      socket.on('disconnect', (reason) => {
        if (reason !== 'io server disconnect' || !active) return;
        retryTimer = setTimeout(() => socket?.connect(), SERVER_DISCONNECT_RETRY_MS);
      });
    }

    void connect();

    return () => {
      active = false;
      clearTimeout(retryTimer);
      socket?.disconnect();
    };
  }, [isReady, businessId, queryClient]);
}
