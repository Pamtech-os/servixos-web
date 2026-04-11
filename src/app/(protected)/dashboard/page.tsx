import type { Metadata } from 'next';
import Dashboard from '@/views/Dashboard';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Dashboard',
  path: '/dashboard',
  description: 'Track business performance and key operational metrics in real time.',
});

export default function DashboardPage() {
  return <Dashboard />;
}
