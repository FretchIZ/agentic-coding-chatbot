import type { VectorSearchResult } from '@learning-platform/shared';

type ScoredResult = {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
  content: string;
};

function toVectorSearchResult(r: ScoredResult): VectorSearchResult {
  return { id: r.id, score: r.score, metadata: r.metadata, content: r.content };
}

export class CosineReRanker {
  rerank(queryEmbedding: number[], results: Array<{ id: string; embedding: number[]; metadata?: Record<string, unknown>; content: string }>): VectorSearchResult[] {
    return results
      .map(r => toVectorSearchResult({
        id: r.id,
        score: this.cosineSimilarity(queryEmbedding, r.embedding),
        metadata: r.metadata ?? {},
        content: r.content,
      }))
      .sort((a, b) => b.score - a.score);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return magA && magB ? dot / (magA * magB) : 0;
  }
}

export class L2ReRanker {
  rerank(queryEmbedding: number[], results: Array<{ id: string; embedding: number[]; metadata?: Record<string, unknown>; content: string }>): VectorSearchResult[] {
    return results
      .map(r => toVectorSearchResult({
        id: r.id,
        score: 1 / (1 + this.l2Distance(queryEmbedding, r.embedding)),
        metadata: r.metadata ?? {},
        content: r.content,
      }))
      .sort((a, b) => b.score - a.score);
  }

  private l2Distance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }
}

export class DotProductReRanker {
  rerank(queryEmbedding: number[], results: Array<{ id: string; embedding: number[]; metadata?: Record<string, unknown>; content: string }>): VectorSearchResult[] {
    return results
      .map(r => toVectorSearchResult({
        id: r.id,
        score: queryEmbedding.reduce((sum, val, i) => sum + val * r.embedding[i], 0),
        metadata: r.metadata ?? {},
        content: r.content,
      }))
      .sort((a, b) => b.score - a.score);
  }
}