'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/hooks/queries/use-roles';
import { useClockMe } from '@/hooks/queries/use-employees';

export interface ResolvedPermissions {
  isOwner: boolean;
  permissions: string[];
  isResolving: boolean;
}

export function usePermissions(): ResolvedPermissions {
  const { auth } = useAuth();

  const isOwner = auth.userRole === 'owner';

  const directPermissions = (() => {
    const value = (auth.user as { permissions?: unknown } | null)?.permissions;
    return Array.isArray(value) ? (value as string[]) : [];
  })();

  const shouldFetchRole = !isOwner && directPermissions.length === 0;
  const rolesQuery = useRoles();
  // /clock/me needs no permission, unlike searching /staff (employees.view).
  const clockMeQuery = useClockMe({ enabled: shouldFetchRole });

  const rolePermissions = useMemo(() => {
    const roleIdFromSession = (auth.user as { roleId?: unknown } | null)?.roleId;
    const roleId =
      typeof roleIdFromSession === 'string'
        ? roleIdFromSession
        : clockMeQuery.data?.employee.roleId;
    if (!roleId) return [];
    const role = (rolesQuery.data ?? []).find((r) => r._id === roleId);
    return role?.permissions ?? [];
  }, [auth.user, clockMeQuery.data?.employee.roleId, rolesQuery.data]);

  const permissions = directPermissions.length > 0 ? directPermissions : rolePermissions;

  const isResolving =
    !isOwner &&
    directPermissions.length === 0 &&
    (rolesQuery.isLoading || clockMeQuery.isLoading);

  return { isOwner, permissions, isResolving };
}
