import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import '@/styles/globals.css';
import { Providers } from '@/providers';
import ThemeToggle from '@/components/theme-toggle';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kudos.ai',
  description: 'AI-powered coding agent platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="fixed bottom-4 right-4 z-50">
            <ThemeToggle />
          </div>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}