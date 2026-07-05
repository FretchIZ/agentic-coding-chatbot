import type { VectorSearchResult } from '@learning-platform/shared';

function toResult(item: { id: string; score: number; content?: string; metadata?: Record<string, unknown> }): VectorSearchResult {
  return { id: item.id, score: item.score, content: item.content ?? '', metadata: item.metadata ?? {} };
}

export class VectorRetriever {
  async retrieve(queryEmbedding: number[], topK: number = 10): Promise<VectorSearchResult[]> {
    return this.queryVectorDB(queryEmbedding, topK);
  }

  private async queryVectorDB(embedding: number[], topK: number): Promise<VectorSearchResult[]> {
    const response = await fetch(`${process.env.VECTOR_DB_URL || 'http://localhost:8000'}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embedding, topK }),
    });
    return (await response.json()) as VectorSearchResult[];
  }
}

export class KeywordRetriever {
  retrieve(query: string, documents: Array<{ id: string; content: string }>): VectorSearchResult[] {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scores: Array<{ id: string; score: number }> = [];
    for (const doc of documents) {
      const content = doc.content.toLowerCase();
      const score = terms.reduce((sum, term) => {
        const count = (content.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        return sum + count;
      }, 0);
      if (score > 0) scores.push({ id: doc.id, score });
    }
    return scores.sort((a, b) => b.score - a.score).slice(0, 10).map(s => toResult({ id: s.id, score: s.score }));
  }
}

export class HybridRetriever {
  constructor(
    private vectorRetriever: VectorRetriever,
    private keywordRetriever: KeywordRetriever,
    private alpha: number = 0.7
  ) {}

  async retrieve(query: string, queryEmbedding: number[], documents: Array<{ id: string; content: string }>): Promise<VectorSearchResult[]> {
    const vectorResults = await this.vectorRetriever.retrieve(queryEmbedding, 20);
    const keywordResults = this.keywordRetriever.retrieve(query, documents);
    return this.fuseResults(vectorResults, keywordResults).slice(0, 10);
  }

  private fuseResults(vector: VectorSearchResult[], keyword: VectorSearchResult[]): VectorSearchResult[] {
    const map = new Map<string, { vectorScore: number; keywordScore: number }>();
    for (const r of vector) map.set(r.id, { vectorScore: r.score, keywordScore: 0 });
    for (const r of keyword) {
      const existing = map.get(r.id);
      if (existing) existing.keywordScore = r.score;
      else map.set(r.id, { vectorScore: 0, keywordScore: r.score });
    }
    return Array.from(map.entries()).map(([id, scores]) => toResult({
      id,
      score: this.alpha * scores.vectorScore + (1 - this.alpha) * scores.keywordScore,
    })).sort((a, b) => b.score - a.score);
  }
}