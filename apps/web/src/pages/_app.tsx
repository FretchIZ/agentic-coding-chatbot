import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Learning Platform',
  description: 'Personalized AI-powered learning platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}