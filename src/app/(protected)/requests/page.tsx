import type { Metadata } from 'next';
import Requests from '@/views/Requests';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Requests',
  path: '/requests',
  description: 'Review and process incoming service requests efficiently.',
});

export default function RequestsPage() {
  return <Requests />;
}
