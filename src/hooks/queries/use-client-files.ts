'use client';

import { useQuery } from '@tanstack/react-query';
import { files } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useClientFiles(clientId: string) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['client-files', businessId, clientId],
    queryFn: () => files.listByClient(businessId, clientId),
    enabled: !!businessId && auth.isPinVerified && !!clientId,
  });
}
