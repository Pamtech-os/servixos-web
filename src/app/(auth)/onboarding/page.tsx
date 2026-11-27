import type { Metadata } from 'next';
import OnboardingWorkspace from '@/views/OnboardingWorkspace';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Build Your Business',
  path: '/onboarding',
  description: 'Shape your business with the ServixOS AI and launch your Online Office.',
});

export default function OnboardingPage() {
  return <OnboardingWorkspace />;
}
