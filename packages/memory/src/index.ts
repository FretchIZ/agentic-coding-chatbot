export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  projectId?: string;
  userId?: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryStore {
  get(key: string, projectId?: string): Promise<MemoryEntry | null>;
  set(key: string, value: string, opts?: { projectId?: string; userId?: string; type?: string }): Promise<MemoryEntry>;
  delete(key: string, projectId?: string): Promise<void>;
  search(query: string, projectId?: string): Promise<MemoryEntry[]>;
  list(projectId?: string): Promise<MemoryEntry[]>;
}

export class InMemoryStore implements MemoryStore {
  private store = new Map<string, MemoryEntry>();

  private makeKey(key: string, projectId?: string): string {
    return projectId ? `${projectId}:${key}` : key;
  }

  async get(key: string, projectId?: string): Promise<MemoryEntry | null> {
    return this.store.get(this.makeKey(key, projectId)) ?? null;
  }

  async set(key: string, value: string, opts?: { projectId?: string; userId?: string; type?: string }): Promise<MemoryEntry> {
    const now = new Date();
    const entry: MemoryEntry = {
      id: `${key}_${Date.now()}`,
      key,
      value,
      projectId: opts?.projectId,
      userId: opts?.userId,
      type: opts?.type ?? 'general',
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(this.makeKey(key, opts?.projectId), entry);
    return entry;
  }

  async delete(key: string, projectId?: string): Promise<void> {
    this.store.delete(this.makeKey(key, projectId));
  }

  async search(query: string, projectId?: string): Promise<MemoryEntry[]> {
    const lower = query.toLowerCase();
    return this.list(projectId).then((entries) =>
      entries.filter((e) => e.key.toLowerCase().includes(lower) || e.value.toLowerCase().includes(lower)),
    );
  }

  async list(projectId?: string): Promise<MemoryEntry[]> {
    const entries = Array.from(this.store.values());
    if (projectId) return entries.filter((e) => e.projectId === projectId);
    return entries;
  }
}
