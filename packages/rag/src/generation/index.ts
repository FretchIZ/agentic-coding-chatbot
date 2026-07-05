import type { AIMessage, VectorSearchResult, RAGContext } from '@learning-platform/shared';
import type { ModelResponse } from '@learning-platform/ai';

export class PromptBuilder {
  build(query: string, chunks: VectorSearchResult[]): string {
    const context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n');
    return `You are an AI tutor. Use the following context to answer the user's question.
If the context doesn't contain relevant information, say so.

Context:
${context}

Question: ${query}

Provide a comprehensive answer based on the context:`;
  }
}

export class ContextAssembler {
  assemble(chunks: VectorSearchResult[], maxTokens: number = 3000): string {
    let context = '';
    for (const chunk of chunks) {
      const chunkTokens = (chunk.content ?? '').split(/\s+/).length;
      if (context.split(/\s+/).length + chunkTokens > maxTokens) break;
      context += (context ? '\n\n' : '') + (chunk.content ?? '');
    }
    return context;
  }

  formatWithSources(chunks: VectorSearchResult[]): string {
    return chunks.map((c, i) => `[Source ${i + 1}]\n${c.content}`).join('\n\n');
  }
}

export class ResponsePostProcessor {
  process(response: string, chunks: VectorSearchResult[]): string {
    let processed = response;
    processed = this.addSourceReferences(processed, chunks);
    processed = this.removeIncompleteSentences(processed);
    return processed.trim();
  }

  private addSourceReferences(text: string, chunks: VectorSearchResult[]): string {
    return text + '\n\n---\n' + chunks.map((c, i) => `[${i + 1}]`).join(' ');
  }

  private removeIncompleteSentences(text: string): string {
    const lastSentence = text.match(/[.!?]\s*$/);
    if (!lastSentence) {
      const lastPeriod = text.lastIndexOf('.');
      if (lastPeriod > 0) return text.substring(0, lastPeriod + 1);
    }
    return text;
  }
}