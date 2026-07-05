export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  filter?: Record<string, string>;
}

export interface VectorStore {
  upsert(id: string, vector: number[], metadata: Record<string, unknown>): Promise<void>;
  query(vector: number[], options?: SearchOptions): Promise<SearchResult[]>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface SearchProvider {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  indexDocument(id: string, title: string, content: string, metadata?: Record<string, unknown>): Promise<void>;
  removeDocument(id: string): Promise<void>;
}

export class InMemoryVectorStore implements VectorStore {
  private items: Map<string, { vector: number[]; metadata: Record<string, unknown> }> = new Map();

  async upsert(id: string, vector: number[], metadata: Record<string, unknown>): Promise<void> {
    this.items.set(id, { vector, metadata });
  }

  async query(vector: number[], options?: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    for (const [id, item] of this.items) {
      const score = this.cosineSimilarity(vector, item.vector);
      if (score >= (options?.threshold ?? 0)) {
        results.push({
          id,
          title: (item.metadata.title as string) || id,
          content: (item.metadata.content as string) || '',
          score,
          source: (item.metadata.source as string) || 'memory',
          metadata: item.metadata,
        });
      }
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, options?.limit ?? 10);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  async clear(): Promise<void> {
    this.items.clear();
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }
}

export class InMemorySearchProvider implements SearchProvider {
  private store = new InMemoryVectorStore();

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const mockVector = new Array(1536).fill(0).map(() => Math.random());
    return this.store.query(mockVector, options);
  }

  async indexDocument(id: string, title: string, content: string, metadata?: Record<string, unknown>): Promise<void> {
    const mockVector = new Array(1536).fill(0).map(() => Math.random());
    await this.store.upsert(id, mockVector, { title, content, ...metadata });
  }

  async removeDocument(id: string): Promise<void> {
    await this.store.delete(id);
  }
}
