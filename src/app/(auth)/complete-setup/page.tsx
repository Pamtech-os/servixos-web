import type { Metadata } from 'next';
import CompleteSetup from '@/views/CompleteSetup';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Complete Setup',
  path: '/complete-setup',
  description: 'Set your new password and PIN to finish employee account setup.',
});

export default function CompleteSetupPage() {
  return <CompleteSetup />;
}
