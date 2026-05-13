'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import {
  createSocketAuthHeaders,
  getSocketAuthPayload,
  SOCKET_BASE_URL,
  type TeamMessage,
  type OnlineEmployee,
} from '@/lib/api-client';
import type { PaginationMeta } from '@/lib/pagination';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

export interface TypingUser {
  userId: string;
  userName: string;
}

interface TeamMessageEvent {
  message: TeamMessage;
}

interface SocketAnnouncement {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  createdAt: string;
}

interface AnnouncementEvent {
  announcement: SocketAnnouncement;
}

type MessagePage = { data: TeamMessage[]; meta: PaginationMeta };

// Presence event shapes the server may emit
interface PresenceUpdatedEvent {
  online?: OnlineEmployee[];
  members?: OnlineEmployee[];
  staff?: OnlineEmployee[];
}

interface UserPresenceEvent {
  user?: OnlineEmployee;
  member?: OnlineEmployee;
  staff?: OnlineEmployee;
  _id?: string;
  id?: string;
}

// Typing event shapes the server may emit
interface TypingEvent {
  userId?: string;
  userName?: string;
  name?: string;
  user?: { _id?: string; fullName?: string; name?: string };
}

export function useTeamSocket(seenMessageIds: React.RefObject<Set<string>>) {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  const businessId = auth.user?.businessId ?? '';
  const accessToken = auth.accessToken ?? '';

  useEffect(() => {
    if (!businessId || !accessToken || !auth.isPinVerified) return;

    let active = true;
    let isInitialConnect = true;
    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

    async function connect() {
      const authPayload = await getSocketAuthPayload(accessToken, businessId);
      const headers = createSocketAuthHeaders(authPayload);

      if (!active) return;

      const socket = io(`${SOCKET_BASE_URL}/chat`, {
        auth: authPayload,
        extraHeaders: headers,
        transportOptions: {
          polling: {
            extraHeaders: headers,
          },
        },
        withCredentials: true,
      });

      socketRef.current = socket;

      socket.on('team_message_sent', ({ message }: TeamMessageEvent) => {
        if (seenMessageIds.current.has(message.id)) return;
        seenMessageIds.current.add(message.id);
        queryClient.setQueryData<InfiniteData<MessagePage>>(
          ['team-messages', businessId],
          (prev) => {
            if (!prev || !Array.isArray(prev.pages) || prev.pages.length === 0) return prev;
            const pages = [...prev.pages];
            const lastIdx = pages.length - 1;
            const lastPage = pages[lastIdx];
            const existing = Array.isArray(lastPage?.data) ? lastPage.data : [];
            pages[lastIdx] = { ...lastPage, data: [...existing, message] };
            return { ...prev, pages };
          }
        );
      });

      socket.on('announcement_created', ({ announcement }: AnnouncementEvent) => {
        toast.info(`New announcement: ${announcement.title}`);
        void queryClient.invalidateQueries({ queryKey: ['announcements', businessId] });
      });

      // ── Presence events ──────────────────────────────────────────────────────
      const onlineKey = ['employees', businessId, 'online'];

      const handlePresenceList = (data: PresenceUpdatedEvent | OnlineEmployee[]) => {
        const list = Array.isArray(data)
          ? data
          : (data.online ?? data.members ?? data.staff ?? []);
        queryClient.setQueryData<OnlineEmployee[]>(onlineKey, list);
      };

      const handleUserOnline = (data: UserPresenceEvent) => {
        const member = data.user ?? data.member ?? data.staff ?? (data as OnlineEmployee);
        if (!member?._id) return;
        queryClient.setQueryData<OnlineEmployee[]>(onlineKey, (prev) => {
          const existing = prev ?? [];
          if (existing.find((u) => u._id === member._id)) return existing;
          return [...existing, member];
        });
      };

      const handleUserOffline = (data: UserPresenceEvent) => {
        const id = data._id ?? data.id ?? data.user?._id ?? data.member?._id;
        if (!id) return;
        queryClient.setQueryData<OnlineEmployee[]>(onlineKey, (prev) =>
          prev ? prev.filter((u) => u._id !== id) : []
        );
      };

      socket.on('presence_updated', handlePresenceList);
      socket.on('presence_update', handlePresenceList);
      socket.on('online_members', handlePresenceList);
      socket.on('online_users', handlePresenceList);
      socket.on('user_online', handleUserOnline);
      socket.on('member_online', handleUserOnline);
      socket.on('staff_online', handleUserOnline);
      socket.on('user_offline', handleUserOffline);
      socket.on('member_offline', handleUserOffline);
      socket.on('staff_offline', handleUserOffline);

      // ── Typing events ────────────────────────────────────────────────────────
      const typingKey = ['team-typing', businessId];

      const handleTypingStart = (data: TypingEvent) => {
        const userId = data.userId ?? data.user?._id ?? '';
        const userName =
          data.userName ?? data.name ?? data.user?.fullName ?? data.user?.name ?? 'Someone';
        if (!userId) return;

        // Refresh the auto-expire timer for this user
        const existing = typingTimers.get(userId);
        if (existing) clearTimeout(existing);

        queryClient.setQueryData<TypingUser[]>(typingKey, (prev) => {
          const list = (prev ?? []).filter((u) => u.userId !== userId);
          return [...list, { userId, userName }];
        });

        const timer = setTimeout(() => {
          typingTimers.delete(userId);
          queryClient.setQueryData<TypingUser[]>(typingKey, (prev) =>
            prev ? prev.filter((u) => u.userId !== userId) : []
          );
        }, 4000);
        typingTimers.set(userId, timer);
      };

      const handleTypingStop = (data: TypingEvent) => {
        const userId = data.userId ?? data.user?._id ?? '';
        if (!userId) return;
        const timer = typingTimers.get(userId);
        if (timer) {
          clearTimeout(timer);
          typingTimers.delete(userId);
        }
        queryClient.setQueryData<TypingUser[]>(typingKey, (prev) =>
          prev ? prev.filter((u) => u.userId !== userId) : []
        );
      };

      // Wire all common typing event names
      socket.on('typing', handleTypingStart);
      socket.on('user_typing', handleTypingStart);
      socket.on('is_typing', handleTypingStart);
      socket.on('typing_started', handleTypingStart);
      socket.on('stop_typing', handleTypingStop);
      socket.on('typing_stopped', handleTypingStop);
      socket.on('user_stopped_typing', handleTypingStop);

      // On reconnect, refetch missed messages and refresh online list
      socket.on('connect', () => {
        if (isInitialConnect) {
          isInitialConnect = false;
          return;
        }
        void queryClient.invalidateQueries({ queryKey: ['team-messages', businessId] });
        void queryClient.invalidateQueries({ queryKey: onlineKey });
      });
    }

    void connect();

    return () => {
      active = false;
      // Clear all pending typing timers and reset typing state
      typingTimers.forEach((timer) => clearTimeout(timer));
      typingTimers.clear();
      queryClient.setQueryData(['team-typing', businessId], []);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [businessId, accessToken, auth.isPinVerified, queryClient, seenMessageIds]);

  return socketRef;
}
