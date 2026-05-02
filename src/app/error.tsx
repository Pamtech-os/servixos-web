'use client';

import { useEffect } from 'react';
import ErrorPage from '@/views/ErrorPage';

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

  const errorMessage =
    process.env.NODE_ENV === 'development'
      ? error.message
      : error.digest
        ? `Reference: ${error.digest}`
        : undefined;

  return (
    <ErrorPage
      title='Something went wrong'
      description='An unexpected error occurred while loading this page. Please try again.'
      errorCode='500'
      errorMessage={errorMessage}
      onRetry={reset}
    />
  );
}
