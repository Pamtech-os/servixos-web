import type { useRouter } from 'next/navigation';
import type { NotificationView } from '@/lib/api-client';
import { openJob } from '@/lib/open-job';
import { openServiceRequest } from '@/lib/open-request';

export interface NotificationTarget {
  label: string;
  open: (router: ReturnType<typeof useRouter>) => void;
}

/** Where clicking a notification leads, or null when it has nothing to open. */
export function getNotificationTarget(notification: NotificationView): NotificationTarget | null {
  const { jobId, requestId } = notification.data ?? {};
  if (notification.type === 'contract_signed' && jobId) {
    return { label: 'View job', open: (router) => openJob(router, jobId) };
  }
  if (requestId) {
    return { label: 'View request', open: (router) => openServiceRequest(router, requestId) };
  }
  if (jobId) {
    return { label: 'View job', open: (router) => openJob(router, jobId) };
  }
  return null;
}
