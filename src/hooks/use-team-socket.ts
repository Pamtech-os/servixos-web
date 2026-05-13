'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import {
  getSocketAuthHeaders,
  SOCKET_BASE_URL,
  type TeamMessage,
} from '@/lib/api-client';
import type { PaginationMeta } from '@/lib/pagination';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

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

    async function connect() {
      const headers = await getSocketAuthHeaders(accessToken, businessId);

      if (!active) return;

      // Do NOT restrict to websocket-only: browsers cannot send custom headers
      // in a raw WebSocket handshake, so extraHeaders only work during the
      // initial HTTP polling phase. Letting socket.io use its default
      // (polling → websocket upgrade) ensures auth headers are delivered.
      const socket = io(`${SOCKET_BASE_URL}/chat`, {
        auth: { token: accessToken },
        extraHeaders: headers,
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
            // API returns ascending; append new message at the end of the last page
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

      // On reconnect (not initial connect), refetch to catch up on missed messages
      socket.on('connect', () => {
        if (isInitialConnect) {
          isInitialConnect = false;
          return;
        }
        void queryClient.invalidateQueries({ queryKey: ['team-messages', businessId] });
      });
    }

    void connect();

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [businessId, accessToken, auth.isPinVerified, queryClient, seenMessageIds]);

  return socketRef;
}
