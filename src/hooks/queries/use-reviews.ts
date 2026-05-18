'use client';

import { useQuery } from '@tanstack/react-query';
import { reviews, type ReviewsQuery } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useReviews(query: ReviewsQuery = {}) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['reviews', businessId, query],
    queryFn: () => reviews.list(businessId, query),
    enabled: !!businessId && auth.isPinVerified,
  });
}

export function useReviewStats() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['reviews', 'stats', businessId],
    queryFn: () => reviews.stats(businessId),
    enabled: !!businessId && auth.isPinVerified,
  });
}
