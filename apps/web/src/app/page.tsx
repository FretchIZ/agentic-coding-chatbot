import Link from 'next/link';

export const dynamic = 'force-dynamic';

const features = [
  { title: 'Smart Chat', desc: 'Powered by Mistral AI with real-time streaming responses', icon: '💬' },
  { title: 'Code Execution', desc: 'Run terminal commands and edit files directly from chat', icon: '⚡' },
  { title: 'Web Search', desc: 'Automatic web context for every query', icon: '🌐' },
  { title: 'File Upload', desc: 'Attach images, PDFs, video, and code files', icon: '📎' },
];

export default async function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute -bottom-40 left-1/2 h-72 w-72 rounded-full bg-primary/5 blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
      </div>

      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm transition-transform group-hover:scale-105">S</div>
            <span className="text-xl font-bold">Sai.ai</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/sign-in" className="btn-ghost h-9 px-4 text-sm">Sign In</Link>
            <Link href="/sign-up" className="btn-primary h-9 px-5 text-sm">Get Started</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 sm:px-8 py-20 sm:py-32 text-center">
          <div className="animate-fade-in-up">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Powered by Mistral AI
            </div>
          </div>
          <h1 className="mb-6 text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1]">
            <span className="text-gradient">AI-Powered</span>
            <br />
            <span>Coding Tools</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg sm:text-xl text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Smart chat, code execution, file management, and web search — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/chat" className="btn-primary h-12 px-8 text-base gap-2">
              Start Chatting
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/dashboard" className="btn-outline h-12 px-8 text-base">
              View Dashboard
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-8 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="card-hover rounded-2xl border bg-card p-6 animate-fade-in-up"
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg">{f.icon}</div>
                <h3 className="mb-1.5 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Sai.ai &mdash; AI-powered coding tools
      </footer>
    </div>
  );
}
