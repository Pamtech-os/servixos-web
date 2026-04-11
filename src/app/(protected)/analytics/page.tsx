import type { Metadata } from 'next';
import Analytics from '@/views/Analytics';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Analytics',
  path: '/analytics',
  description: 'Understand growth trends, conversion, and operational performance.',
});

export default function AnalyticsPage() {
  return <Analytics />;
}
