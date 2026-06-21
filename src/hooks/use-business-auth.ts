'use client';

import { useAuth } from '@/contexts/AuthContext';

export function useBusinessAuth() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const isReady = !!businessId && auth.isPinVerified;
  return { auth, businessId, isReady };
}
