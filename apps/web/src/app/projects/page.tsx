export const dynamic = 'force-dynamic';

export default function ProjectsPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-bold">Projects</h1>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-muted-foreground">No projects yet.</p>
      </main>
    </div>
  );
}
