// Domain modules — import directly from these for new feature code:
//   import { jobs } from '@/lib/api/jobs';
//   import type { Job } from '@/lib/api/jobs';
//
// This barrel re-exports everything so existing imports continue to work unchanged.

export * from './api/core';
export * from './api/auth';
export * from './api/website';
export * from './api/roles';
export * from './api/employees';
export * from './api/clients';
export * from './api/jobs';
export * from './api/invoices';
export * from './api/payments';
export * from './api/schedules';
export * from './api/tasks';
export * from './api/requests';
export * from './api/team';
export * from './api/files';
export * from './api/reviews';
export * from './api/analytics';
export * from './api/support';
export * from './api/subscription';
export * from './api/settings';
export * from './api/activity-logs';
export * from './api/socket';
