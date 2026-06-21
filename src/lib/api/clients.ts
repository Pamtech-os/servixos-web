import { protectedGet, protectedRequest } from './core';
import type { PaginationMeta } from '@/lib/pagination';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Client {
  _id: string;
  businessId: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientsQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ClientExportResult {
  exportUrl: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const clients = {
  list: async (
    businessId: string,
    query: ClientsQuery = {}
  ): Promise<{ data: Client[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/clients${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Client[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  get: async (businessId: string, id: string): Promise<Client> => {
    const envelope = await protectedGet<Client>(`/clients/${id}`, businessId);
    return envelope.data;
  },

  create: (businessId: string, input: CreateClientInput): Promise<Client> =>
    protectedRequest<Client>('POST', '/clients', businessId, input),

  update: (businessId: string, id: string, input: UpdateClientInput): Promise<Client> =>
    protectedRequest<Client>('PATCH', `/clients/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/clients/${id}`, businessId),

  export: async (businessId: string, id: string): Promise<ClientExportResult> => {
    const envelope = await protectedGet<ClientExportResult>(`/clients/${id}/export`, businessId);
    return envelope.data;
  },
};
