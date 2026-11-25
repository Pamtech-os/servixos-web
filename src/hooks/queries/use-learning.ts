'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { learning } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import { HttpError } from '@/common/network/http-client';

export const LEARNING_PREFERENCES_KEY = 'learning-preferences';

/** Loaded once per session; the PATCH mutation keeps the cache in sync afterwards. */
export function useLearningPreferences() {
  const { businessId, isReady } = useBusinessAuth();
  const { logout } = useAuth();

  const query = useQuery({
    queryKey: [LEARNING_PREFERENCES_KEY, businessId],
    queryFn: () => learning.getPreferences(businessId),
    enabled: isReady,
    staleTime: Infinity,
  });

  const isUserGone = query.error instanceof HttpError && query.error.status === 404;
  useEffect(() => {
    if (isUserGone) logout();
  }, [isUserGone, logout]);

  return query;
}
