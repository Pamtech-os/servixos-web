import type { Metadata } from 'next';
import MyWebsite from '@/views/MyWebsite';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'My Website',
  path: '/my-website',
  description: 'Manage and optimize your public-facing business website experience.',
});

export default function MyWebsitePage() {
  return <MyWebsite />;
}
