'use client';

import { useQuery } from '@tanstack/react-query';
import { website } from '@/lib/api-client';
import { HttpError } from '@/common/network/http-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export const WEBSITE_CONFIG_KEY = 'website-config';

export function useWebsiteConfig() {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: [WEBSITE_CONFIG_KEY, businessId],
    queryFn: () => website.getConfig(businessId),
    enabled: isReady,
    retry: (failCount, error) => {
      if (error instanceof HttpError && error.status === 404) return false;
      return failCount < 2;
    },
  });
}
