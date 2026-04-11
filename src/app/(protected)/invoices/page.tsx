import type { Metadata } from 'next';
import Invoices from '@/views/Invoices';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Invoices',
  path: '/invoices',
  description: 'Generate, track, and reconcile invoices for all active clients.',
});

export default function InvoicesPage() {
  return <Invoices />;
}
