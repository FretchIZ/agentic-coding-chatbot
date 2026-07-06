import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getAgents() {
  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const res = await fetch(`${base}/api/agents`, { cache: 'no-store' });
    if (res.ok) { const d = await res.json(); return d.agents || []; }
  } catch {}
  return [];
}

export default async function DashboardPage() {
  const agents = await getAgents();

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Agent performance and usage analytics</p>
        </div>
        <Link href="/chat" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">Open Chat</Link>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Runs', value: '0', change: '+0%' },
          { label: 'Active Agents', value: String(agents.length), change: 'online' },
          { label: 'Tasks Completed', value: '0', change: '+0%' },
          { label: 'Avg Response', value: '0ms', change: '--' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Agents</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((agent: any) => (
            <div key={agent.id} className="rounded-lg border p-4">
              <h3 className="font-semibold">{agent.name}</h3>
              <p className="mb-3 text-xs text-muted-foreground">{agent.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Runs: 0</span>
                <span className="inline-flex items-center gap-1 text-green-500"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Idle</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="border-b px-4 py-3"><h2 className="font-semibold">Recent Activity</h2></div>
        <div className="p-8 text-center text-sm text-muted-foreground">No activity yet. Start a chat to see agent runs here.</div>
      </div>
    </div>
  );
}
