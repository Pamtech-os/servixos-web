'use client';

import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/common/hooks/use-network-status';

export function NetworkStatusBanner() {
  const { isOnline, isSlowConnection, effectiveType } = useNetworkStatus();

  if (isOnline && !isSlowConnection) {
    return null;
  }

  return (
    <div
      className='sticky top-0 z-[70] flex items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-700 dark:text-amber-300'
      role='status'
      aria-live='polite'
    >
      {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
      {!isOnline ? (
        <span>You are offline. Navigation may be limited until your connection is restored.</span>
      ) : (
        <span>
          Slow network detected{effectiveType ? ` (${effectiveType})` : ''}. Some pages may load
          later than usual.
        </span>
      )}
    </div>
  );
}
