import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - AI Learning Platform',
  description: 'Administrative dashboard for the AI learning platform',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}