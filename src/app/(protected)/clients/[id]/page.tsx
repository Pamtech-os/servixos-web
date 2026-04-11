import type { Metadata } from 'next';
import ClientDetail from '@/views/ClientDetail';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Client Details',
  path: '/clients',
  description: 'Review a client timeline, billing history, jobs, and related records.',
});

export default function ClientDetailPage() {
  return <ClientDetail />;
}
