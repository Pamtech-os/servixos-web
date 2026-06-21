import { protectedGet, protectedRequest } from './core';
import type { PaginationMeta } from '@/lib/pagination';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'Technical' | 'Account' | 'Billing' | 'General';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSupportTicketInput {
  subject: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
}

export interface SupportTicketsQuery {
  page?: number;
  limit?: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const supportTickets = {
  list: async (
    businessId: string,
    query: SupportTicketsQuery = {}
  ): Promise<{ data: SupportTicket[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/support/tickets${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<{ tickets: SupportTicket[]; meta: PaginationMeta }>(path, businessId);
    return { data: envelope.data.tickets, meta: envelope.data.meta };
  },

  get: async (businessId: string, id: string): Promise<SupportTicket> => {
    const envelope = await protectedGet<SupportTicket>(`/support/tickets/${id}`, businessId);
    return envelope.data;
  },

  create: (businessId: string, input: CreateSupportTicketInput): Promise<SupportTicket> =>
    protectedRequest<SupportTicket>('POST', '/support/tickets', businessId, input),
};
