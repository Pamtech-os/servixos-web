import type { ReactNode } from 'react';
import AppLayout from '@/components/AppLayout';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
