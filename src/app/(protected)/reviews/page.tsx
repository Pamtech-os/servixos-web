import type { Metadata } from 'next';
import Reviews from '@/views/Reviews';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Reviews',
  path: '/reviews',
  description: 'View client ratings and feedback for completed jobs.',
});

export default function ReviewsPage() {
  return <Reviews />;
}
