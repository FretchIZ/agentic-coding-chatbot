import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary" />
            <span className="text-xl font-bold">Sai.ai</span>
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
            AI-Powered<br /><span className="text-primary">Coding Assistant</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Smart chat powered by Mistral AI. Persistent conversations, Markdown rendering, and code formatting — all in one place.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/chat" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Start Chatting</Link>
            <Link href="/dashboard" className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent">View Dashboard</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
