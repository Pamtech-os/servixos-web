'use client';

import { useQuery } from '@tanstack/react-query';
import { categories } from '@/lib/api-client';

export function useBusinessCategories() {
  return useQuery({
    queryKey: ['business-categories'],
    queryFn: () => categories.list(),
    staleTime: 60 * 60 * 1000, // 1 hour — categories rarely change
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 0,
  });
}
