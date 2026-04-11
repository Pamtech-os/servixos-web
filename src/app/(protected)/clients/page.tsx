import type { Metadata } from 'next';
import Clients from '@/views/Clients';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Clients',
  path: '/clients',
  description: 'Manage client profiles, communication history, and account value.',
});

export default function ClientsPage() {
  return <Clients />;
}
