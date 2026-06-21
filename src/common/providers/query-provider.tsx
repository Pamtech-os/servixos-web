'use client';

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type PropsWithChildren } from 'react';
import { toast } from '@/components/ui/sonner';
import { NetworkOfflineError } from '@/common/network/http-client';

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (error instanceof NetworkOfflineError) {
          toast.error('You are offline', {
            description: 'Reconnect to the internet to refresh live data.',
          });
          return;
        }

        // if (error instanceof RequestTimeoutError) {
        //   toast.error('Network timeout', {
        //     description: 'The network is slow. Please try again in a moment.',
        //   });
        //   return;
        // }

        // toast.error('Something went wrong', {
        //   description: 'We could not load fresh data. Please try again.',
        // });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 300_000,
        retry: 0,
        refetchOnWindowFocus: false,
        networkMode: 'offlineFirst',
      },
      mutations: {
        retry: 0,
        networkMode: 'offlineFirst',
      },
    },
  });
}

export function AppQueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
