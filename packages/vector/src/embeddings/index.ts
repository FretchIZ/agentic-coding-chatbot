import { AIModelProvider, VECTOR_DIMENSIONS } from '@learning-platform/shared';

export interface EmbeddingProvider {
  name: string;
  dimensions: number;
  embed(text: string | string[]): Promise<number[][]>;
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  name = 'openai';
  dimensions = VECTOR_DIMENSIONS['text-embedding-ada-002'];

  async embed(text: string | string[]): Promise<number[][]> {
    const texts = Array.isArray(text) ? text : [text];
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: texts,
      }),
    });
    const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
    return data.data.map((d: { embedding: number[] }) => d.embedding);
  }
}

export class LocalEmbeddingProvider implements EmbeddingProvider {
  name = 'local';
  dimensions = 768;

  async embed(text: string | string[]): Promise<number[][]> {
    const texts = Array.isArray(text) ? text : [text];
    const response = await fetch(`${process.env.LOCAL_AI_URL || 'http://localhost:11434'}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.LOCAL_AI_MODEL || 'llama3',
        prompt: texts[0],
      }),
    });
    const data = (await response.json()) as { embedding: number[] };
    return [data.embedding];
  }
}

export function createEmbeddingProvider(provider: AIModelProvider, model?: string): EmbeddingProvider {
  switch (provider) {
    case AIModelProvider.OPENAI:
      return new OpenAIEmbeddingProvider();
    case AIModelProvider.LOCAL:
      return new LocalEmbeddingProvider();
    default:
      return new OpenAIEmbeddingProvider();
  }
}
