import type { Metadata } from 'next';
import PinEntry from '@/views/PinEntry';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'PIN Verification',
  path: '/pin',
  description: 'Verify your account PIN before entering your office.',
});

export default function PinEntryPage() {
  return <PinEntry />;
}
