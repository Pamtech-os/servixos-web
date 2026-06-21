'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { reviews, type ReviewsQuery } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useReviews(query: ReviewsQuery = {}) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['reviews', businessId, query],
    queryFn: () => reviews.list(businessId, query),
    enabled: isReady,
    placeholderData: keepPreviousData,
  });
}

export function useReviewStats() {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['reviews', 'stats', businessId],
    queryFn: () => reviews.stats(businessId),
    enabled: isReady,
  });
}
