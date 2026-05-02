import type { Metadata } from 'next';
import Settings from '@/views/Settings';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Settings',
  path: '/settings',
  description: 'Configure your account, preferences, and office behavior.',
});

export default function SettingsPage() {
  return <Settings />;
}
