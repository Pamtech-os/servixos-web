import type { Metadata } from 'next';
import RoleEdit from '@/views/RoleEdit';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Edit Role',
  path: '/roles',
  description: 'Manage role name and permissions.',
});

export default function RoleEditPage() {
  return <RoleEdit />;
}
