import { CHUNK_DEFAULTS } from '@learning-platform/shared';

export interface ChunkingResult {
  chunks: string[];
  metadata: Array<{ index: number; start: number; end: number; strategy: string }>;
}

export class TextChunker {
  constructor(
    private chunkSize: number = CHUNK_DEFAULTS.size,
    private chunkOverlap: number = CHUNK_DEFAULTS.overlap
  ) {}

  chunk(text: string): ChunkingResult {
    return this.chunkByParagraph(text);
  }

  chunkByParagraph(text: string): ChunkingResult {
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
    const chunks: string[] = [];
    const metadata: ChunkingResult['metadata'] = [];
    let current = '';
    let start = 0;
    for (const para of paragraphs) {
      if (current.length + para.length > this.chunkSize && current) {
        chunks.push(current.trim());
        metadata.push({ index: chunks.length - 1, start, end: start + current.length, strategy: 'paragraph' });
        start += current.length + 2;
        current = this.getOverlap(current);
      }
      current += (current ? '\n\n' : '') + para;
    }
    if (current.trim()) {
      chunks.push(current.trim());
      metadata.push({ index: chunks.length - 1, start, end: start + current.length, strategy: 'paragraph' });
    }
    return { chunks, metadata };
  }

  chunkBySentence(text: string): ChunkingResult {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    const metadata: ChunkingResult['metadata'] = [];
    let current = '';
    let start = 0;
    for (const sentence of sentences) {
      if (current.length + sentence.length > this.chunkSize && current) {
        chunks.push(current.trim());
        metadata.push({ index: chunks.length - 1, start, end: start + current.length, strategy: 'sentence' });
        start += current.length;
        current = this.getOverlap(current);
      }
      current += sentence;
    }
    if (current.trim()) {
      chunks.push(current.trim());
      metadata.push({ index: chunks.length - 1, start, end: start + current.length, strategy: 'sentence' });
    }
    return { chunks, metadata };
  }

  chunkByCode(text: string): ChunkingResult {
    const lines = text.split('\n');
    const chunks: string[] = [];
    const metadata: ChunkingResult['metadata'] = [];
    let current: string[] = [];
    let start = 0;
    for (const line of lines) {
      if (current.join('\n').length > this.chunkSize && current.length > 0) {
        const chunkText = current.join('\n');
        chunks.push(chunkText);
        metadata.push({ index: chunks.length - 1, start, end: start + chunkText.length, strategy: 'code' });
        start += chunkText.length + 1;
        current = current.slice(-Math.floor(this.chunkOverlap / 80));
      }
      current.push(line);
    }
    if (current.length > 0) {
      const chunkText = current.join('\n');
      chunks.push(chunkText);
      metadata.push({ index: chunks.length - 1, start, end: start + chunkText.length, strategy: 'code' });
    }
    return { chunks, metadata };
  }

  chunkByMarkdown(text: string): ChunkingResult {
    const sections = text.split(/(?=^#{1,3}\s)/m).filter(Boolean);
    const chunks: string[] = [];
    const metadata: ChunkingResult['metadata'] = [];
    let start = 0;
    for (const section of sections) {
      if (section.length > this.chunkSize) {
        const subChunks = this.chunkByParagraph(section);
        chunks.push(...subChunks.chunks);
        metadata.push(...subChunks.metadata);
      } else {
        chunks.push(section.trim());
        metadata.push({ index: chunks.length - 1, start, end: start + section.length, strategy: 'markdown' });
      }
      start += section.length;
    }
    return { chunks, metadata };
  }

  private getOverlap(text: string): string {
    const words = text.split(/\s+/);
    const overlapWords = words.slice(-Math.floor(this.chunkOverlap / 5));
    return overlapWords.join(' ');
  }
}