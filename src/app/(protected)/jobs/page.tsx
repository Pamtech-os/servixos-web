import type { Metadata } from 'next';
import Jobs from '@/views/Jobs';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Jobs',
  path: '/jobs',
  description: 'Plan jobs, assign teams, and monitor progress across active projects.',
});

export default function JobsPage() {
  return <Jobs />;
}
