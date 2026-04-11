'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center'>
      <AlertTriangle className='h-10 w-10 text-amber-500' />
      <h2 className='text-2xl font-semibold'>Something went wrong</h2>
      <p className='max-w-md text-sm text-muted-foreground'>
        We could not load this page right now. If your network is unstable, wait a moment and try
        again.
      </p>
      <Button onClick={reset} className='gap-2'>
        <RefreshCw size={16} /> Try again
      </Button>
    </div>
  );
}
