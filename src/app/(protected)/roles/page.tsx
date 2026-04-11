import type { Metadata } from 'next';
import Roles from '@/views/Roles';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Roles',
  path: '/roles',
  description: 'Manage team permissions and role assignments securely.',
});

export default function RolesPage() {
  return <Roles />;
}
