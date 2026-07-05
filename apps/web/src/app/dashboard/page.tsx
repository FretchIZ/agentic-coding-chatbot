export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-bold">Dashboard</h1>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Projects', value: '0' },
            { label: 'Tasks', value: '0' },
            { label: 'Agent Runs', value: '0' },
            { label: 'Files', value: '0' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
