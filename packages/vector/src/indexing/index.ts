import { CHUNK_DEFAULTS } from '@learning-platform/shared';
import type { ChunkingStrategy } from '@learning-platform/shared';

export interface ChunkResult {
  chunks: string[];
  metadata: Array<Record<string, unknown>>;
}

export class TextChunker {
  constructor(
    private strategy: ChunkingStrategy = 'paragraph',
    private size: number = CHUNK_DEFAULTS.size,
    private overlap: number = CHUNK_DEFAULTS.overlap
  ) {}

  chunk(text: string): ChunkResult {
    switch (this.strategy) {
      case 'sentence':
        return this.chunkBySentence(text);
      case 'paragraph':
        return this.chunkByParagraph(text);
      case 'overlapping':
        return this.chunkByOverlapping(text);
      case 'code':
        return this.chunkByCode(text);
      case 'markdown':
        return this.chunkByMarkdown(text);
      default:
        return this.chunkByParagraph(text);
    }
  }

  private chunkBySentence(text: string): ChunkResult {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    const metadata: Array<Record<string, unknown>> = [];
    let current = '';
    let index = 0;
    for (const sentence of sentences) {
      if (current.length + sentence.length > this.size && current) {
        chunks.push(current.trim());
        metadata.push({ index, start: index * this.size, strategy: 'sentence' });
        current = sentence;
        index++;
      } else {
        current += sentence;
      }
    }
    if (current.trim()) {
      chunks.push(current.trim());
      metadata.push({ index, start: index * this.size, strategy: 'sentence' });
    }
    return { chunks, metadata };
  }

  private chunkByParagraph(text: string): ChunkResult {
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
    const chunks: string[] = [];
    const metadata: Array<Record<string, unknown>> = [];
    let current = '';
    let index = 0;
    for (const paragraph of paragraphs) {
      if (current.length + paragraph.length > this.size && current) {
        chunks.push(current.trim());
        metadata.push({ index, strategy: 'paragraph', size: current.length });
        current = paragraph;
        index++;
      } else {
        current += (current ? '\n\n' : '') + paragraph;
      }
    }
    if (current.trim()) {
      chunks.push(current.trim());
      metadata.push({ index, strategy: 'paragraph', size: current.length });
    }
    return { chunks, metadata };
  }

  private chunkByOverlapping(text: string): ChunkResult {
    const chunks: string[] = [];
    const metadata: Array<Record<string, unknown>> = [];
    let index = 0;
    for (let i = 0; i < text.length; i += this.size - this.overlap) {
      const chunk = text.slice(i, i + this.size);
      if (chunk.length < 10) break;
      chunks.push(chunk);
      metadata.push({ index, start: i, end: i + this.size, strategy: 'overlapping' });
      index++;
    }
    return { chunks, metadata };
  }

  private chunkByCode(text: string): ChunkResult {
    const chunks: string[] = [];
    const metadata: Array<Record<string, unknown>> = [];
    const lines = text.split('\n');
    let current: string[] = [];
    let index = 0;
    for (const line of lines) {
      if (current.join('\n').length > this.size && current.length > 0) {
        chunks.push(current.join('\n'));
        metadata.push({ index, strategy: 'code', lines: current.length });
        current = [];
        index++;
      }
      current.push(line);
    }
    if (current.length > 0) {
      chunks.push(current.join('\n'));
      metadata.push({ index, strategy: 'code', lines: current.length });
    }
    return { chunks, metadata };
  }

  private chunkByMarkdown(text: string): ChunkResult {
    const chunks: string[] = [];
    const metadata: Array<Record<string, unknown>> = [];
    const sections = text.split(/(?=^#{1,3}\s)/m).filter(Boolean);
    let current = '';
    let index = 0;
    for (const section of sections) {
      if (current.length + section.length > this.size && current) {
        chunks.push(current.trim());
        const header = current.match(/^#{1,3}\s(.+)$/m);
        metadata.push({ index, strategy: 'markdown', header: header?.[1] || null });
        current = section;
        index++;
      } else {
        current += (current ? '\n' : '') + section;
      }
    }
    if (current.trim()) {
      chunks.push(current.trim());
      const header = current.match(/^#{1,3}\s(.+)$/m);
      metadata.push({ index, strategy: 'markdown', header: header?.[1] || null });
    }
    return { chunks, metadata };
  }
}

export class BatchIndexer {
  constructor(private chunker: TextChunker) {}

  async indexDocuments(
    documents: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>,
    embedFn: (texts: string[]) => Promise<number[][]>
  ): Promise<Array<{ id: string; chunks: Array<{ content: string; embedding: number[]; metadata: Record<string, unknown> }> }>> {
    const results = [];
    for (const doc of documents) {
      const { chunks, metadata: chunkMeta } = this.chunker.chunk(doc.content);
      const embeddings = await embedFn(chunks);
      results.push({
        id: doc.id,
        chunks: chunks.map((content, i) => ({
          content,
          embedding: embeddings[i],
          metadata: { ...doc.metadata, ...chunkMeta[i] },
        })),
      });
    }
    return results;
  }
}

export class IncrementalIndexer {
  private indexedIds = new Set<string>();

  constructor(private batchIndexer: BatchIndexer) {}

  async addDocument(
    doc: { id: string; content: string; metadata?: Record<string, unknown> },
    embedFn: (texts: string[]) => Promise<number[][]>
  ): Promise<boolean> {
    if (this.indexedIds.has(doc.id)) return false;
    await this.batchIndexer.indexDocuments([doc], embedFn);
    this.indexedIds.add(doc.id);
    return true;
  }

  removeDocument(id: string): void {
    this.indexedIds.delete(id);
  }

  getStats(): { totalDocuments: number } {
    return { totalDocuments: this.indexedIds.size };
  }
}