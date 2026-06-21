'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { roles, permissions, type Role } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useRoles() {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['roles', businessId],
    queryFn: () => roles.list(businessId),
    enabled: isReady,
  });
}

export function useRole(id: string) {
  const { businessId, isReady } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['roles', businessId, id],
    queryFn: () => roles.get(businessId, id),
    enabled: isReady && !!id && id !== 'new',
    // Pre-populate from the already-loaded list so permissions appear immediately
    initialData: () =>
      queryClient.getQueryData<Role[]>(['roles', businessId])?.find((r) => r._id === id),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['roles', businessId])?.dataUpdatedAt,
  });
}

export function usePermissions() {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['permissions', businessId],
    queryFn: () => permissions.list(businessId),
    staleTime: Infinity,
    enabled: isReady,
  });
}
