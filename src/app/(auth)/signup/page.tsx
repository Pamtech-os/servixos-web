import type { Metadata } from 'next';
import Signup from '@/views/Signup';
import { buildPageMetadata } from '@/common/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Create Account',
  path: '/signup',
  description: 'Create a ServixOS account and launch your business workspace.',
});

export default function SignupPage() {
  return <Signup />;
}
