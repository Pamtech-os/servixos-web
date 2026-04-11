import type { Metadata } from 'next';
import ClockHistory from '@/views/ClockHistory';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Employee Clock History',
  path: '/teams',
  description: 'Inspect attendance and break history for a team member.',
});

export default function ClockHistoryPage() {
  return <ClockHistory />;
}
