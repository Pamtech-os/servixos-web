import type { Metadata } from 'next';
import Payments from '@/views/Payments';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Payments',
  path: '/payments',
  description: 'Monitor incoming payments, balances, and outstanding transactions.',
});

export default function PaymentsPage() {
  return <Payments />;
}
