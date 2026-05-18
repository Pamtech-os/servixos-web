'use client';

import { hasPermission } from '@/common/auth/permissions';
import { usePermissions } from '@/hooks/permissions/use-permissions';

export function useAccess() {
  const { isOwner, permissions, isResolving } = usePermissions();

  const can = (perm: string) => isOwner || hasPermission(permissions, perm);

  return {
    isOwner,
    isResolving,

    // ── Sidebar pages ─────────────────────────────────────────────────────────
    canViewClients: can('clients.view'),
    canViewJobs: can('jobs.view'),
    canViewInvoices: can('invoices.view'),
    canViewPayments: can('payments.view'),
    canViewRequests: can('requests.view'),
    canViewAnalytics: can('analytics.view'),
    canViewSettings: can('settings.view'),
    // Owner-only pages
    canViewRoles: isOwner,
    canViewMyWebsite: isOwner,
    canViewReviews: isOwner,
    canViewAiInsights: isOwner,
    canViewAiAdvisor: isOwner,
    canViewActivityLogs: isOwner,

    // ── Teams tabs ────────────────────────────────────────────────────────────
    canViewEmployees: can('employees.view'),
    canViewSchedules: can('schedules.view'),
    canViewTimeTracking: can('time.view'),
    canViewTasks: can('tasks.view'),
    // Communications is always accessible — no permission required
    canViewCommunications: true,

    // ── Write operations (for conditionally hiding action buttons) ────────────
    canCreateClients: can('clients.create'),
    canCreateJobs: can('jobs.create'),
    canCreateInvoices: can('invoices.create'),
    canCreatePayments: can('payments.create'),
    canCreateEmployees: can('employees.create'),
    canEditEmployees: can('employees.edit'),
    canDeleteEmployees: can('employees.delete'),
    canCreateSchedules: can('schedules.create'),
    canEditSchedules: can('schedules.edit'),
    canDeleteSchedules: can('schedules.delete'),
    canCreateTasks: can('tasks.create'),
    canEditTasks: can('tasks.edit'),
  };
}
