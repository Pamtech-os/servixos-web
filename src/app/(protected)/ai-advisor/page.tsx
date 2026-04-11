import type { Metadata } from 'next';
import AIAdvisor from '@/views/AIAdvisor';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'AI Advisor',
  path: '/ai-advisor',
  description: 'Chat with your AI business advisor for pricing, ops, and growth guidance.',
});

export default function AIAdvisorPage() {
  return <AIAdvisor />;
}
