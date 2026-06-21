import { protectedGet, protectedRequest } from './core';
import type { PaginationMeta } from '@/lib/pagination';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'pending' | 'partial' | 'paid';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceClient {
  _id: string;
  email: string;
  name: string;
}

export interface Invoice {
  _id: string;
  businessId: string;
  clientId: InvoiceClient | string;
  jobId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate?: string;
  lineItems: InvoiceLineItem[];
  taxRate: number;
  totalAmount: number;
  amountPaid: number;
  pdfUrl?: string;
  sentAt?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceStatistics {
  totalCollected: number;
  outstanding: number;
}

export interface InvoicesQuery {
  search?: string;
  clientId?: string;
  status?: InvoiceStatus;
  page?: number;
  limit?: number;
}

export interface CreateInvoiceInput {
  clientId: string;
  invoiceDate: string;
  dueDate?: string;
  lineItems: InvoiceLineItem[];
  taxRate?: number;
  jobId?: string;
}

export interface UpdateInvoiceInput {
  status?: InvoiceStatus;
  dueDate?: string;
  lineItems?: InvoiceLineItem[];
  taxRate?: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const invoices = {
  list: async (
    businessId: string,
    query: InvoicesQuery = {}
  ): Promise<{ data: Invoice[]; meta: PaginationMeta; statistics: InvoiceStatistics }> => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.clientId) params.set('clientId', query.clientId);
    if (query.status) params.set('status', query.status);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/invoices${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Invoice[]>(path, businessId);
    const stats = envelope.statistics as InvoiceStatistics | undefined;
    return {
      data: envelope.data,
      meta: envelope.meta!,
      statistics: stats ?? { totalCollected: 0, outstanding: 0 },
    };
  },

  get: async (businessId: string, id: string): Promise<Invoice> => {
    const envelope = await protectedGet<Invoice>(`/invoices/${id}`, businessId);
    return envelope.data;
  },

  getPdf: async (businessId: string, id: string): Promise<{ pdfUrl: string }> => {
    const envelope = await protectedGet<{ pdfUrl: string }>(`/invoices/${id}/pdf`, businessId);
    return envelope.data;
  },

  create: (businessId: string, input: CreateInvoiceInput): Promise<Invoice> =>
    protectedRequest<Invoice>('POST', '/invoices', businessId, input),

  update: (businessId: string, id: string, input: UpdateInvoiceInput): Promise<Invoice> =>
    protectedRequest<Invoice>('PATCH', `/invoices/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/invoices/${id}`, businessId),

  send: (businessId: string, id: string): Promise<Invoice> =>
    protectedRequest<Invoice>('POST', `/invoices/${id}/send`, businessId),
};
