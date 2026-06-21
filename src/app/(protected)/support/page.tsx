import type { Metadata } from 'next';
import Support from '@/views/Support';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Support',
  path: '/support',
  description: 'Submit and track support tickets for your business.',
});

export default function SupportPage() {
  return <Support />;
}
