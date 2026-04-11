import type { Metadata } from 'next';
import Login from '@/views/Login';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Login',
  path: '/login',
  description: 'Securely sign in to your ServixOS dashboard.',
});

export default function LoginPage() {
  return <Login />;
}
