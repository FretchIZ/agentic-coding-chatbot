import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your chat activity and usage</p>
        </div>
        <Link href="/chat" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">Open Chat</Link>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Conversations', value: '0', change: 'persistent' },
          { label: 'Model', value: 'Mistral AI', change: 'online' },
          { label: 'Messages', value: '0', change: 'across all chats' },
          { label: 'Status', value: 'Ready', change: '--' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border">
        <div className="border-b px-4 py-3"><h2 className="font-semibold">Recent Activity</h2></div>
        <div className="p-8 text-center text-sm text-muted-foreground">No activity yet. Start a chat to see your conversation history here.</div>
      </div>
    </div>
  );
}
