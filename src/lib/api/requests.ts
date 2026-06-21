import { protectedGet, protectedRequest } from './core';
import type { PaginationMeta } from '@/lib/pagination';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface AiPriceEstimate {
  suggestedPrice: number;
  lowPrice: number;
  highPrice: number;
  confidence: 'low' | 'medium' | 'high';
  currency: string;
  reasoning: string;
}

export interface ServiceRequest {
  _id: string;
  businessId: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  service: string;
  requestedDate: string;
  requestedEndDate?: string;
  message?: string;
  status: RequestStatus;
  quotedPrice?: number;
  startDate?: string;
  endDate?: string;
  actionedAt?: string;
  actionedBy?: string;
  conversationId?: string;
  aiPriceEstimate?: AiPriceEstimate;
  hasAiPriceEstimate: boolean;
  aiPriceEstimatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestStatistics {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  cancelled: number;
}

export interface ServiceRequestsQuery {
  status?: RequestStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RequestConversation {
  _id?: string;
  businessId?: string;
  clientId: string;
  messages: RequestMessagePayload[];
  lastMessageContent?: string;
  lastMessageAt?: string | null;
  businessUnreadCount?: number;
  clientUnreadCount?: number;
}

export interface RequestMessagePayload {
  id: string;
  conversationId: string;
  businessId: string;
  clientId: string;
  sender: 'business' | 'client';
  senderName: string;
  content?: string;
  status: 'sent' | 'delivered' | 'read';
  deliveredAt?: string;
  readAt?: string;
  editedAt?: string;
  attachmentUrl?: string;
  publicId?: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
}

export interface UpdateRequestInput {
  status?: 'accepted' | 'rejected' | 'cancelled';
  quotedPrice?: number;
  startDate?: string;
  endDate?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const serviceRequests = {
  list: async (
    businessId: string,
    query: ServiceRequestsQuery = {}
  ): Promise<{ data: ServiceRequest[]; meta: PaginationMeta; statistics: RequestStatistics }> => {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.search) params.set('search', query.search);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/requests${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<ServiceRequest[]>(path, businessId);
    const stats = envelope.statistics as RequestStatistics | undefined;
    return {
      data: envelope.data,
      meta: envelope.meta!,
      statistics: stats ?? { total: 0, pending: 0, accepted: 0, rejected: 0, cancelled: 0 },
    };
  },

  get: async (businessId: string, id: string): Promise<ServiceRequest> => {
    const envelope = await protectedGet<ServiceRequest>(`/requests/${id}`, businessId);
    return envelope.data;
  },

  getConversation: async (businessId: string, id: string): Promise<RequestConversation> => {
    const envelope = await protectedGet<RequestConversation>(
      `/requests/${id}/conversation`,
      businessId
    );
    return envelope.data;
  },

  getPriceEstimate: async (businessId: string, id: string): Promise<AiPriceEstimate> => {
    const envelope = await protectedGet<AiPriceEstimate>(
      `/requests/${id}/price-estimate`,
      businessId
    );
    return envelope.data;
  },

  update: (businessId: string, id: string, input: UpdateRequestInput): Promise<ServiceRequest> =>
    protectedRequest<ServiceRequest>('PATCH', `/requests/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/requests/${id}`, businessId),
};
