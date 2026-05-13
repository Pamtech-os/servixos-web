'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { roles, permissions, type Role } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useRoles() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['roles', businessId],
    queryFn: () => roles.list(businessId),
    enabled: !!businessId && auth.isPinVerified,
  });
}

export function useRole(id: string) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['roles', businessId, id],
    queryFn: () => roles.get(businessId, id),
    enabled: !!businessId && auth.isPinVerified && !!id && id !== 'new',
    // Pre-populate from the already-loaded list so permissions appear immediately
    initialData: () =>
      queryClient.getQueryData<Role[]>(['roles', businessId])?.find((r) => r._id === id),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['roles', businessId])?.dataUpdatedAt,
  });
}

export function usePermissions() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  return useQuery({
    queryKey: ['permissions', businessId],
    queryFn: () => permissions.list(businessId),
    staleTime: Infinity,
    enabled: !!businessId && auth.isPinVerified,
  });
}
