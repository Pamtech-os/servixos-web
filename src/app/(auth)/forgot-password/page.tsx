import type { Metadata } from 'next';
import ForgotPassword from '@/views/ForgotPassword';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Forgot Password',
  path: '/forgot-password',
  description: 'Reset your ServixOS password securely.',
});

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
