import Link from 'next/link';

export const dynamic = 'force-dynamic';

const stats = [
  { label: 'Conversations', value: '0', change: 'persistent', icon: '💬', color: 'from-blue-500/20 to-blue-600/10' },
  { label: 'Model', value: 'Mistral AI', change: 'mistral-large-latest', icon: '🧠', color: 'from-purple-500/20 to-purple-600/10' },
  { label: 'Web Search', value: 'Always On', change: 'built-in for every chat', icon: '🌐', color: 'from-green-500/20 to-green-600/10' },
  { label: 'Status', value: 'Ready', change: 'all systems operational', icon: '⚡', color: 'from-amber-500/20 to-amber-600/10' },
];

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl p-4 sm:p-8">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-1">
              <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:scale-105 transition-transform">S</Link>
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-11">Your chat activity and usage overview</p>
          </div>
          <Link href="/chat" className="btn-primary h-10 px-5 text-sm gap-2 animate-fade-in">
            Open Chat
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </header>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="card-hover rounded-2xl border bg-card p-5 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color}`}>
                  <span className="text-lg">{s.icon}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 text-2xl font-bold">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.change}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border bg-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <svg className="h-7 w-7 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p className="text-sm font-medium text-foreground/80">No activity yet</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">Start a chat to see your conversation history and usage stats here.</p>
            <Link href="/chat" className="btn-primary mt-4 h-9 px-5 text-sm">Start Chatting</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
