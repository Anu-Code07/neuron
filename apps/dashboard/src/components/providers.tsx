'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useState } from 'react';
import { ActiveProjectProvider } from '@/lib/hooks/use-active-project';
import { UserApiKeyProvider } from '@/lib/hooks/use-user-api-key';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <ActiveProjectProvider>
          <UserApiKeyProvider>{children}</UserApiKeyProvider>
        </ActiveProjectProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
