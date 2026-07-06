'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  requestMessages,
  SOCKET_BASE_URL,
  getSocketAuthPayload,
  createSocketAuthHeaders,
  type RequestMessagePayload,
} from '@/lib/api-client';
import type { ChatMessage, ChatSendPayload } from '@/components/ChatUI';

const TYPING_STOP_MS = 2000;
const OPTIMISTIC_ID_PREFIX = 'optimistic-';

interface RoomJoinedPayload {
  room: string;
  history?: RequestMessagePayload[];
  clientOnline?: boolean;
}

interface PresenceEvent {
  userId?: string;
  clientId?: string;
  id?: string;
  _id?: string;
}

interface MessageReceivedEvent {
  message: RequestMessagePayload;
}

interface MessageDeliveredEvent {
  messageId: string;
  deliveredAt?: string;
}

interface MessageReadEvent {
  upToMessageId: string;
  readAt?: string;
  readBy?: string;
}

interface UserTypingEvent {
  userId?: string;
  senderName?: string;
}

interface ClientTypingEvent {
  clientId: string;
}

interface SocketErrorEvent {
  code?: string;
  message: string;
}

export const mergeRequestMessages = (
  current: RequestMessagePayload[],
  incoming: RequestMessagePayload[]
): RequestMessagePayload[] => {
  if (!incoming.length) return current;

  const merged = [...current];

  const findOptimisticMatchIndex = (msg: RequestMessagePayload) => {
    if (msg.sender !== 'business') return -1;
    const targetContent = (msg.content ?? '').trim();
    const targetFileName = msg.fileName ?? '';
    const targetTime = new Date(msg.createdAt).getTime();

    return merged.findIndex((existing) => {
      if (!existing.id.startsWith(OPTIMISTIC_ID_PREFIX)) return false;
      if (existing.sender !== 'business') return false;
      const existingContent = (existing.content ?? '').trim();
      const existingFileName = existing.fileName ?? '';
      const sameContent = existingContent === targetContent;
      const sameFile = existingFileName === targetFileName;
      if (targetContent) {
        if (!sameContent) return false;
      } else if (!targetFileName || !sameFile) {
        return false;
      }

      const existingTime = new Date(existing.createdAt).getTime();
      if (!Number.isFinite(existingTime) || !Number.isFinite(targetTime)) return true;
      // Use a 2-hour window: servers returning timestamps without a timezone suffix are parsed
      // as local time by JS, which can introduce up to a 1-hour offset (e.g. UTC+1 regions).
      return Math.abs(existingTime - targetTime) < 2 * 60 * 60 * 1000;
    });
  };

  incoming.forEach((msg) => {
    const indexById = merged.findIndex((existing) => existing.id === msg.id);
    if (indexById >= 0) {
      merged[indexById] = { ...merged[indexById], ...msg };
      return;
    }

    const optimisticIndex = findOptimisticMatchIndex(msg);
    if (optimisticIndex >= 0) {
      merged[optimisticIndex] = { ...merged[optimisticIndex], ...msg };
      return;
    }

    merged.push(msg);
  });

  return merged.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return aTime - bTime;
  });
};

const mapRequestMessageToChatMessage = (message: RequestMessagePayload): ChatMessage => ({
  id: message.id,
  sender: message.sender,
  senderName: message.senderName,
  content: message.content,
  status: message.status,
  timestamp: new Date(message.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }),
  attachment: message.attachmentUrl || message.fileName
    ? {
        name: message.fileName ?? 'Attachment',
        type: message.mimeType,
        size: message.fileSize,
        url: message.attachmentUrl,
      }
    : undefined,
});

export interface UseClientChatSocketOptions {
  clientId: string;
  peerName?: string;
  enabled?: boolean;
  conversationId?: string;
  externalHistory?: RequestMessagePayload[];
}

/**
 * Drives a real-time (socket.io) chat conversation scoped to a single client. The socket room
 * is keyed by `clientId` on the server, so this works for any surface (service-request chat,
 * client detail page, etc.) without needing a request-specific conversation lookup.
 */
export function useClientChatSocket({
  clientId,
  peerName = 'Client',
  enabled = true,
  conversationId,
  externalHistory,
}: UseClientChatSocketOptions) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const businessUserId = auth.user?.id ?? '';

  const socketRef = useRef<Socket | null>(null);
  const hasJoinedRoomRef = useRef(false);
  const lastMarkedReadIdRef = useRef('');
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const incomingTypingClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingOutboundRef = useRef<
    Array<{ localId: string; content: string; attachment?: File }>
  >([]);
  const isFlushingOutboundRef = useRef(false);
  const isTypingRef = useRef(false);

  const [messages, setMessages] = useState<RequestMessagePayload[]>([]);
  const [typingLabel, setTypingLabel] = useState('');
  const [isClientOnline, setIsClientOnline] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);

  const businessSenderName = useMemo(() => {
    const first = auth.user?.firstName?.trim() ?? '';
    const last = auth.user?.lastName?.trim() ?? '';
    return `${first} ${last}`.trim() || 'You';
  }, [auth.user?.firstName, auth.user?.lastName]);

  const emitTypingStop = useCallback(() => {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    if (!isTypingRef.current) return;
    if (socketRef.current && clientId) {
      socketRef.current.emit('typing_stop', { clientId });
    }
    isTypingRef.current = false;
  }, [clientId]);

  const emitTypingStart = useCallback(() => {
    if (!socketRef.current || !clientId || !socketRef.current.connected) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketRef.current.emit('typing_start', { clientId });
    }
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => emitTypingStop(), TYPING_STOP_MS);
  }, [clientId, emitTypingStop]);

  const clearIncomingTypingLabel = useCallback(() => {
    if (incomingTypingClearTimerRef.current) {
      clearTimeout(incomingTypingClearTimerRef.current);
      incomingTypingClearTimerRef.current = null;
    }
    setTypingLabel('');
  }, []);

  const flushOutboundQueue = useCallback(() => {
    if (isFlushingOutboundRef.current) return;
    const socket = socketRef.current;
    if (!socket || !socket.connected || !hasJoinedRoomRef.current || !clientId) return;

    isFlushingOutboundRef.current = true;

    const process = async () => {
      while (pendingOutboundRef.current.length > 0) {
        if (!socket.connected || !hasJoinedRoomRef.current) break;
        const next = pendingOutboundRef.current[0];
        if (!next) break;

        let attachmentPayload:
          | {
              attachmentUrl: string;
              publicId: string;
              mimeType: string;
              fileName: string;
              fileSize: number;
            }
          | undefined;

        if (next.attachment) {
          try {
            const uploaded = await requestMessages.uploadAttachment(businessId, next.attachment);
            attachmentPayload = {
              attachmentUrl: uploaded.attachmentUrl,
              publicId: uploaded.publicId,
              mimeType: uploaded.mimeType,
              fileName: uploaded.fileName,
              fileSize: uploaded.fileSize,
            };
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === next.localId ? { ...msg, ...attachmentPayload } : msg
              )
            );
          } catch {
            if (!next.content.trim()) {
              setMessages((prev) => prev.filter((msg) => msg.id !== next.localId));
              pendingOutboundRef.current.shift();
              continue;
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === next.localId
                  ? {
                      ...msg,
                      attachmentUrl: undefined,
                      publicId: undefined,
                      mimeType: undefined,
                      fileName: undefined,
                      fileSize: undefined,
                    }
                  : msg
              )
            );
          }
        }

        socket.emit('send_message', {
          clientId,
          ...(next.content.trim() ? { content: next.content.trim() } : {}),
          ...(attachmentPayload ?? {}),
        });

        pendingOutboundRef.current.shift();
      }
    };

    void process().finally(() => {
      isFlushingOutboundRef.current = false;
      if (pendingOutboundRef.current.length > 0) {
        setTimeout(() => {
          flushOutboundQueue();
        }, 300);
      }
    });
  }, [businessId, clientId]);

  useEffect(() => {
    if (!enabled || !clientId) return;
    setMessages([]);
    setTypingLabel('');
    setIsClientOnline(false);
    setHasJoinedRoom(false);
    lastMarkedReadIdRef.current = '';
    hasJoinedRoomRef.current = false;
    pendingOutboundRef.current = [];
    isFlushingOutboundRef.current = false;
    isTypingRef.current = false;
  }, [enabled, clientId]);

  useEffect(() => {
    if (!enabled || !externalHistory?.length) return;
    setMessages((prev) => mergeRequestMessages(prev, externalHistory));
  }, [enabled, externalHistory]);

  useEffect(() => {
    if (!enabled || !clientId || !businessId) return;

    let active = true;

    async function connect() {
      const authPayload = await getSocketAuthPayload(businessId);
      const headers = createSocketAuthHeaders(authPayload);

      if (!active) return;

      const socket = io(`${SOCKET_BASE_URL}/chat`, {
        transports: ['websocket', 'polling'],
        auth: authPayload,
        extraHeaders: headers,
        transportOptions: { polling: { extraHeaders: headers } },
        withCredentials: true,
      });
      socketRef.current = socket;

      const handleConnected = () => {
        socket.emit('join_room', { clientId });
      };

      const handleServerConnected = () => {
        hasJoinedRoomRef.current = false;
      };

      const handleRoomJoined = ({ history, clientOnline }: RoomJoinedPayload) => {
        hasJoinedRoomRef.current = true;
        setHasJoinedRoom(true);
        if (Array.isArray(history)) {
          setMessages((prev) => mergeRequestMessages(prev, history));
        }
        if (clientOnline !== undefined) setIsClientOnline(clientOnline);
        flushOutboundQueue();
      };

      const handleClientOnline = (data: PresenceEvent) => {
        const id = data.clientId ?? data.userId ?? data._id ?? data.id;
        if (!id || id === clientId) setIsClientOnline(true);
      };

      const handleClientOffline = (data: PresenceEvent) => {
        const id = data.clientId ?? data.userId ?? data._id ?? data.id;
        if (!id || id === clientId) setIsClientOnline(false);
      };

      const handleMessageReceived = (data: MessageReceivedEvent | RequestMessagePayload) => {
        const message = (data as MessageReceivedEvent).message ?? (data as RequestMessagePayload);
        if (!message?.id) return;
        if (message.clientId && clientId && message.clientId !== clientId) return;
        setMessages((prev) => mergeRequestMessages(prev, [message]));
      };

      const handleMessageDelivered = ({ messageId, deliveredAt }: MessageDeliveredEvent) => {
        if (!messageId) return;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  status: msg.status === 'read' ? 'read' : 'delivered',
                  deliveredAt: deliveredAt ?? msg.deliveredAt,
                }
              : msg
          )
        );
      };

      const handleMessageRead = ({ upToMessageId, readAt }: MessageReadEvent) => {
        if (!upToMessageId) return;
        setMessages((prev) => {
          const upToIndex = prev.findIndex((msg) => msg.id === upToMessageId);
          if (upToIndex === -1) return prev;
          return prev.map((msg, idx) =>
            idx <= upToIndex && msg.sender === 'business'
              ? { ...msg, status: 'read', readAt: readAt ?? msg.readAt }
              : msg
          );
        });
      };

      const handleUserTyping = ({ userId, senderName }: UserTypingEvent) => {
        if (userId && userId === businessUserId) return;
        const name = senderName?.trim() || peerName;
        setTypingLabel(`${name} is typing`);
        if (incomingTypingClearTimerRef.current) {
          clearTimeout(incomingTypingClearTimerRef.current);
        }
        incomingTypingClearTimerRef.current = setTimeout(() => setTypingLabel(''), 4000);
      };

      const handleUserStoppedTyping = ({ userId }: UserTypingEvent) => {
        if (userId && userId === businessUserId) return;
        clearIncomingTypingLabel();
      };

      const handleClientTyping = ({ clientId: typingClientId }: ClientTypingEvent) => {
        if (typingClientId !== clientId) return;
        setTypingLabel(`${peerName} is typing`);
        if (incomingTypingClearTimerRef.current) {
          clearTimeout(incomingTypingClearTimerRef.current);
        }
        incomingTypingClearTimerRef.current = setTimeout(() => setTypingLabel(''), 4000);
      };

      const handleClientStoppedTyping = ({ clientId: typingClientId }: ClientTypingEvent) => {
        if (typingClientId !== clientId) return;
        clearIncomingTypingLabel();
      };

      const handleSocketError = ({ message }: SocketErrorEvent) => {
        toast.error('Chat error', { description: message || 'Unable to complete chat action.' });
      };

      const handleConnectionError = (error: Error) => {
        toast.error('Chat connection failed', {
          description: error.message || 'Unable to connect to chat.',
        });
        socket.disconnect();
      };

      socket.on('connect', handleConnected);
      socket.on('connected', handleServerConnected);
      socket.on('room_joined', handleRoomJoined);
      socket.on('message_received', handleMessageReceived);
      socket.on('new_message', handleMessageReceived);
      socket.on('message_delivered', handleMessageDelivered);
      socket.on('message_read', handleMessageRead);
      socket.on('user_typing', handleUserTyping);
      socket.on('typing', handleUserTyping);
      socket.on('is_typing', handleUserTyping);
      socket.on('user_stopped_typing', handleUserStoppedTyping);
      socket.on('typing_stop', handleUserStoppedTyping);
      socket.on('client_typing', handleClientTyping);
      socket.on('client_stopped_typing', handleClientStoppedTyping);
      socket.on('user_online', handleClientOnline);
      socket.on('client_online', handleClientOnline);
      socket.on('user_offline', handleClientOffline);
      socket.on('client_offline', handleClientOffline);
      socket.on('error', handleSocketError);
      socket.on('connect_error', handleConnectionError);
    }

    void connect();

    return () => {
      active = false;
      emitTypingStop();
      clearIncomingTypingLabel();
      setIsClientOnline(false);
      hasJoinedRoomRef.current = false;
      const socket = socketRef.current;
      if (socket) {
        if (socket.connected) {
          socket.emit('leave_room', { clientId });
        }
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [
    enabled,
    clientId,
    peerName,
    businessId,
    businessUserId,
    clearIncomingTypingLabel,
    emitTypingStop,
    flushOutboundQueue,
  ]);

  useEffect(() => {
    return () => {
      emitTypingStop();
      clearIncomingTypingLabel();
      pendingOutboundRef.current = [];
      isFlushingOutboundRef.current = false;
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      if (incomingTypingClearTimerRef.current) clearTimeout(incomingTypingClearTimerRef.current);
    };
  }, [clearIncomingTypingLabel, emitTypingStop]);

  const latestIncomingMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].sender === 'client') return messages[i].id;
    }
    return '';
  }, [messages]);

  useEffect(() => {
    if (!enabled || !clientId || !latestIncomingMessageId || !socketRef.current) return;
    if (!hasJoinedRoomRef.current || !socketRef.current.connected) return;
    if (lastMarkedReadIdRef.current === latestIncomingMessageId) return;

    socketRef.current.emit('mark_read', {
      clientId,
      upToMessageId: latestIncomingMessageId,
    });
    lastMarkedReadIdRef.current = latestIncomingMessageId;
  }, [enabled, clientId, latestIncomingMessageId]);

  const sendMessage = useCallback(
    ({ content, attachment }: ChatSendPayload) => {
      if (!clientId) return;

      const trimmedContent = content.trim();
      if (!trimmedContent && !attachment) return;

      const localId = `${OPTIMISTIC_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimisticMessage: RequestMessagePayload = {
        id: localId,
        conversationId: conversationId ?? `pending-${clientId}`,
        businessId,
        clientId,
        sender: 'business',
        senderName: businessSenderName,
        content: trimmedContent || undefined,
        status: 'sent',
        fileName: attachment?.name,
        mimeType: attachment?.type || undefined,
        fileSize: attachment?.size,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => mergeRequestMessages(prev, [optimisticMessage]));
      pendingOutboundRef.current.push({
        localId,
        content: trimmedContent,
        attachment: attachment ?? undefined,
      });

      emitTypingStop();
      flushOutboundQueue();
    },
    [clientId, conversationId, businessId, businessSenderName, emitTypingStop, flushOutboundQueue]
  );

  const chatMessages = useMemo(() => messages.map(mapRequestMessageToChatMessage), [messages]);

  return {
    chatMessages,
    isClientOnline,
    typingLabel,
    hasJoinedRoom,
    sendMessage,
    emitTypingStart,
    emitTypingStop,
  };
}
