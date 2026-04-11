import type { Metadata } from 'next';
import ActivityLogs from '@/views/ActivityLogs';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Activity Logs',
  path: '/activity-logs',
  description: 'Audit critical account and team activity with time-stamped logs.',
});

export default function ActivityLogsPage() {
  return <ActivityLogs />;
}
