import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary" />
            <span className="text-xl font-bold">Kudos.ai</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground">Sign In</Link>
            <Link href="/sign-up" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">Sign Up</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-24 text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            AI-Powered<br /><span className="text-primary">Coding Agent</span> Platform
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Multi-agent orchestration for software development. Plan, code, review, test, and deploy with AI agents.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/chat" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Start Chatting</Link>
            <Link href="/dashboard" className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent">View Dashboard</Link>
          </div>
        </section>
        <section className="border-t">
          <div className="mx-auto max-w-7xl px-4 py-16">
            <h2 className="mb-8 text-center text-2xl font-bold">Core Agents</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { name: 'Planner', desc: 'Breaks down tasks into actionable steps' },
                { name: 'Coder', desc: 'Writes and modifies code across files' },
                { name: 'Reviewer', desc: 'Reviews code for bugs and best practices' },
              ].map((agent) => (
                <div key={agent.name} className="rounded-lg border p-6">
                  <h3 className="mb-2 font-semibold">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">{agent.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}