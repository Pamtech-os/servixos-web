import type { Metadata } from 'next';
import Teams from '@/views/Teams';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Teams',
  path: '/teams',
  description: 'Coordinate team schedules, communication, and assignments.',
});

export default function TeamsPage() {
  return <Teams />;
}
