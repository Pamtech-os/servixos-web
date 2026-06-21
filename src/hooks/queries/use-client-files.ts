'use client';

import { useQuery } from '@tanstack/react-query';
import { files } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useClientFiles(clientId: string) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['client-files', businessId, clientId],
    queryFn: () => files.listByClient(businessId, clientId),
    enabled: isReady && !!clientId,
  });
}
