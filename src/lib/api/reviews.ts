import { protectedGet } from './core';
import type { PaginationMeta } from '@/lib/pagination';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Review {
  _id: string;
  businessId: string;
  clientId: string;
  jobId: string;
  rating: number;
  comment?: string;
}

export interface ReviewStats {
  average: number;
  count: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export interface ReviewsQuery {
  rating?: number;
  page?: number;
  limit?: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const reviews = {
  list: async (
    businessId: string,
    query: ReviewsQuery = {}
  ): Promise<{ data: Review[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.rating != null) params.set('rating', String(query.rating));
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/reviews${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Review[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  stats: async (businessId: string): Promise<ReviewStats> => {
    const envelope = await protectedGet<ReviewStats>('/reviews/stats', businessId);
    return envelope.data;
  },
};
