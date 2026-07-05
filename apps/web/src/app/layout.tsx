import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import '@/styles/globals.css';
import { Providers } from '@/providers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CodeAgent',
  description: 'AI-powered coding agent platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
