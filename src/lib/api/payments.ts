import { protectedGet, protectedRequest } from './core';
import type { PaginationMeta } from '@/lib/pagination';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentMode = 'cash' | 'bank_transfer' | 'credit_card' | 'cheque' | 'mobile_money';
export type PaymentStatus = 'completed' | 'partial';

export interface Payment {
  _id: string;
  businessId: string;
  invoiceId?: {
    _id: string;
    invoiceNumber: string;
  };
  clientId?: string;
  paymentDate: string;
  paymentMode: PaymentMode;
  amount: number;
  status: PaymentStatus;
  notes?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStatistics {
  totalIncome: number;
  received: number;
  pending: number;
  overdue: number;
  outstanding: number;
}

export interface PaymentsQuery {
  search?: string;
  status?: PaymentStatus;
  paymentMode?: PaymentMode;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreatePaymentInput {
  invoiceId?: string;
  jobId?: string;
  clientId?: string;
  paymentDate: string;
  paymentMode: PaymentMode;
  amount: number;
  status?: PaymentStatus;
  notes?: string;
}

export interface UpdatePaymentInput {
  invoiceId?: string;
  clientId?: string;
  paymentDate?: string;
  paymentMode?: PaymentMode;
  amount?: number;
  status?: PaymentStatus;
  notes?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const payments = {
  list: async (
    businessId: string,
    query: PaymentsQuery = {}
  ): Promise<{ data: Payment[]; meta: PaginationMeta; statistics: PaymentStatistics }> => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.paymentMode) params.set('paymentMode', query.paymentMode);
    if (query.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params.set('dateTo', query.dateTo);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/payments${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Payment[]>(path, businessId);
    const stats = envelope.statistics as PaymentStatistics | undefined;
    return {
      data: envelope.data,
      meta: envelope.meta!,
      statistics: stats ?? { totalIncome: 0, received: 0, pending: 0, overdue: 0, outstanding: 0 },
    };
  },

  get: async (businessId: string, id: string): Promise<Payment> => {
    const envelope = await protectedGet<Payment>(`/payments/${id}`, businessId);
    return envelope.data;
  },

  create: (businessId: string, input: CreatePaymentInput): Promise<Payment> =>
    protectedRequest<Payment>('POST', '/payments', businessId, input),

  update: (businessId: string, id: string, input: UpdatePaymentInput): Promise<Payment> =>
    protectedRequest<Payment>('PATCH', `/payments/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/payments/${id}`, businessId),
};
