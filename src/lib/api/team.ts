import { protectedGet, protectedRequest } from './core';
import type { PaginationMeta } from '@/lib/pagination';

// ─── Team Messages types ──────────────────────────────────────────────────────

export interface TeamMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface TeamMessagesQuery {
  page?: number;
  limit?: number;
}

export interface SendTeamMessageInput {
  content: string;
}

// ─── Announcements types ──────────────────────────────────────────────────────

export interface Announcement {
  _id: string;
  businessId: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementsQuery {
  page?: number;
  limit?: number;
}

export interface CreateAnnouncementInput {
  title: string;
  description: string;
}

// ─── Team Messages API ────────────────────────────────────────────────────────

export const teamMessages = {
  list: async (
    businessId: string,
    query: TeamMessagesQuery = {}
  ): Promise<{ data: TeamMessage[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/team/messages${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<TeamMessage[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  send: (businessId: string, input: SendTeamMessageInput): Promise<TeamMessage> =>
    protectedRequest<TeamMessage>('POST', '/team/messages', businessId, input),
};

// ─── Announcements API ────────────────────────────────────────────────────────

export const announcements = {
  list: async (
    businessId: string,
    query: AnnouncementsQuery = {}
  ): Promise<{ data: Announcement[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/team/announcements${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Announcement[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  create: (businessId: string, input: CreateAnnouncementInput): Promise<Announcement> =>
    protectedRequest<Announcement>('POST', '/team/announcements', businessId, input),
};
