'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { ClerkProvider } from '@clerk/nextjs';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <QueryClientProvider client={queryClient}>
      {pk ? <ClerkProvider>{children}</ClerkProvider> : children}
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}