import type { VectorSearchResult } from '@learning-platform/shared';

export interface RetrieverConfig {
  topK: number;
  minScore: number;
  includeMetadata?: boolean;
}

export class SemanticRetriever {
  constructor(private config: RetrieverConfig = { topK: 10, minScore: 0.5 }) {}

  async retrieve(
    queryEmbedding: number[],
    index: Array<{ id: string; embedding: number[]; content: string; metadata?: Record<string, unknown> }>,
    filters?: Record<string, unknown>
  ): Promise<VectorSearchResult[]> {
    const scores: Array<{ id: string; score: number; metadata?: Record<string, unknown>; content: string }> = [];

    for (const item of index) {
      if (filters && !this.matchesFilters(item.metadata, filters)) continue;
      const score = this.cosineSimilarity(queryEmbedding, item.embedding);
      if (score >= this.config.minScore) {
        scores.push({ id: item.id, score, metadata: item.metadata, content: item.content });
      }
    }
    return scores.sort((a, b) => b.score - a.score).slice(0, this.config.topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return magA && magB ? dot / (magA * magB) : 0;
  }

  private matchesFilters(metadata: Record<string, unknown> | undefined, filters: Record<string, unknown>): boolean {
    if (!metadata) return Object.keys(filters).length === 0;
    return Object.entries(filters).every(([key, value]) => metadata[key] === value);
  }
}

export class HybridRetriever {
  constructor(
    private semanticRetriever: SemanticRetriever,
    private alpha: number = 0.5
  ) {}

  async retrieve(
    query: string,
    queryEmbedding: number[],
    index: Array<{ id: string; embedding: number[]; content: string; metadata?: Record<string, unknown> }>
  ): Promise<VectorSearchResult[]> {
    const semanticResults = await this.semanticRetriever.retrieve(queryEmbedding, index);
    const keywordResults = this.keywordSearch(query, index);
    const combined = this.fuseResults(semanticResults, keywordResults);
    return combined.slice(0, 10);
  }

  private keywordSearch(
    query: string,
    index: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>
  ): VectorSearchResult[] {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const results: VectorSearchResult[] = [];
    for (const item of index) {
      const content = item.content.toLowerCase();
      const score = terms.reduce((sum, term) => {
        const count = (content.match(new RegExp(term, 'g')) || []).length;
        return sum + count;
      }, 0) / terms.length;
      if (score > 0) results.push({ id: item.id, score, metadata: item.metadata, content: item.content });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  private fuseResults(
    semantic: VectorSearchResult[],
    keyword: VectorSearchResult[]
  ): VectorSearchResult[] {
    const map = new Map<string, { semantic: number; keyword: number; metadata?: Record<string, unknown>; content: string }>();
    for (const r of semantic) {
      map.set(r.id, { semantic: r.score, keyword: 0, metadata: r.metadata, content: r.content });
    }
    for (const r of keyword) {
      const existing = map.get(r.id);
      if (existing) existing.keyword = r.score;
      else map.set(r.id, { semantic: 0, keyword: r.score, metadata: r.metadata, content: r.content });
    }
    return Array.from(map.entries()).map(([id, scores]) => ({
      id,
      score: this.alpha * scores.semantic + (1 - this.alpha) * scores.keyword,
      metadata: scores.metadata,
      content: scores.content,
    })).sort((a, b) => b.score - a.score);
  }
}

export class MetadataFilter {
  async filter(results: VectorSearchResult[], filters: Record<string, unknown>): Promise<VectorSearchResult[]> {
    return results.filter(r => {
      if (!r.metadata) return Object.keys(filters).length === 0;
      return Object.entries(filters).every(([key, value]) => {
        const metaValue = (r.metadata as Record<string, unknown>)[key];
        if (Array.isArray(value)) return value.includes(metaValue);
        return metaValue === value;
      });
    });
  }
}