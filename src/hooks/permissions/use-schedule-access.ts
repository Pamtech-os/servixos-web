'use client';

import { hasPermission } from '@/common/auth/permissions';
import { usePermissions } from '@/hooks/permissions/use-permissions';

export function useScheduleAccess() {
  const { isOwner, permissions, isResolving } = usePermissions();

  return {
    isOwner,
    permissions,
    canViewSchedules: isOwner || hasPermission(permissions, 'schedules.view'),
    canCreateSchedules: isOwner || hasPermission(permissions, 'schedules.create'),
    canEditSchedules: isOwner || hasPermission(permissions, 'schedules.edit'),
    canDeleteSchedules: isOwner || hasPermission(permissions, 'schedules.delete'),
    isResolvingPermissions: isResolving,
  };
}
