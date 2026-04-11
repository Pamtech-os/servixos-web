import type { Metadata } from 'next';
import AIInsights from '@/views/AIInsights';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'AI Insights',
  path: '/ai-insights',
  description: 'Discover AI-generated recommendations based on live business signals.',
});

export default function AIInsightsPage() {
  return <AIInsights />;
}
