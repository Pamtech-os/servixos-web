import { protectedGet, protectedRequest } from './core';
import type { PaginationMeta } from '@/lib/pagination';

// ─── Job types ────────────────────────────────────────────────────────────────

export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Job {
  _id: string;
  businessId: string;
  clientId: string;
  sourceRequestId?: string;
  title: string;
  description?: string;
  scheduledDate: string;
  location?: string;
  price?: number;
  notes?: string;
  status: JobStatus;
  startedAt?: string;
  completedAt?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobsQuery {
  search?: string;
  clientId?: string;
  status?: JobStatus;
  page?: number;
  limit?: number;
}

export interface CreateJobInput {
  clientId: string;
  title: string;
  description?: string;
  scheduledDate: string;
  location?: string;
  price?: number;
  notes?: string;
}

export interface UpdateJobInput {
  title?: string;
  description?: string;
  scheduledDate?: string;
  location?: string;
  price?: number;
  notes?: string;
}

export interface BulkDeleteResult {
  deletedCount: number;
}

// ─── Contract types ───────────────────────────────────────────────────────────

export type ContractStatus = 'draft' | 'sent' | 'signed' | 'cancelled';

export interface Contract {
  _id: string;
  businessId: string;
  jobId: string;
  clientId: string;
  title: string;
  html?: string;
  pdfUrl?: string;
  amount: number;
  expiresAt?: string;
  status: ContractStatus;
  sentAt?: string;
  signedAt?: string;
  signingUrl?: string;
  clientAppDeliveredAt?: string;
  timezone: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractsQuery {
  clientId?: string;
  status?: ContractStatus;
  page?: number;
  limit?: number;
}

export interface CreateContractInput {
  clientId: string;
  jobId: string;
  name: string;
  amount: number;
  expiresAt?: string;
}

export interface UpdateContractInput {
  status?: ContractStatus;
  signedAt?: string;
}

// ─── Jobs API ─────────────────────────────────────────────────────────────────

export const jobs = {
  list: async (
    businessId: string,
    query: JobsQuery = {}
  ): Promise<{ data: Job[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.clientId) params.set('clientId', query.clientId);
    if (query.status) params.set('status', query.status);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/jobs${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Job[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  get: async (businessId: string, id: string): Promise<Job> => {
    const envelope = await protectedGet<Job>(`/jobs/${id}`, businessId);
    return envelope.data;
  },

  create: (businessId: string, input: CreateJobInput): Promise<Job> =>
    protectedRequest<Job>('POST', '/jobs', businessId, input),

  update: (businessId: string, id: string, input: UpdateJobInput): Promise<Job> =>
    protectedRequest<Job>('PATCH', `/jobs/${id}`, businessId, input),

  start: (businessId: string, id: string): Promise<Job> =>
    protectedRequest<Job>('PATCH', `/jobs/${id}/start`, businessId),

  complete: (businessId: string, id: string): Promise<Job> =>
    protectedRequest<Job>('PATCH', `/jobs/${id}/complete`, businessId),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/jobs/${id}`, businessId),

  bulkDelete: (businessId: string, ids: string[]): Promise<BulkDeleteResult> =>
    protectedRequest<BulkDeleteResult>('DELETE', '/jobs', businessId, { ids }),
};

// ─── Contracts API ────────────────────────────────────────────────────────────

export const contracts = {
  list: async (
    businessId: string,
    query: ContractsQuery = {}
  ): Promise<{ data: Contract[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.clientId) params.set('clientId', query.clientId);
    if (query.status) params.set('status', query.status);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/contracts${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Contract[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  get: async (businessId: string, id: string): Promise<Contract> => {
    const envelope = await protectedGet<Contract>(`/contracts/${id}`, businessId);
    return envelope.data;
  },

  create: (businessId: string, input: CreateContractInput): Promise<Contract> =>
    protectedRequest<Contract>('POST', '/contracts', businessId, input),

  update: (businessId: string, id: string, input: UpdateContractInput): Promise<Contract> =>
    protectedRequest<Contract>('PATCH', `/contracts/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/contracts/${id}`, businessId),

  getPdf: async (businessId: string, id: string): Promise<{ url: string }> => {
    const envelope = await protectedGet<{ url: string }>(`/contracts/${id}/pdf`, businessId);
    return envelope.data;
  },

  send: (businessId: string, id: string, clientEmail: string): Promise<{ queued: boolean }> =>
    protectedRequest<{ queued: boolean }>('POST', `/contracts/${id}/send`, businessId, {
      clientEmail,
    }),
};
