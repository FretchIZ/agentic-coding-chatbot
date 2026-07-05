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
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );

  return pk ? <ClerkProvider>{content}</ClerkProvider> : content;
}
