'use client';

import { ReactNode, useState } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function ClientProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <PerfectScrollbar>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </PerfectScrollbar>
  );
}

export default ClientProviders;
