import type { AIMessage, VectorSearchResult, RAGContext } from '@learning-platform/shared';
import { TextChunker } from '../chunking';
import { VectorRetriever, KeywordRetriever, HybridRetriever } from '../retrieval';
import { PromptBuilder, ContextAssembler, ResponsePostProcessor } from '../generation';

export interface RAGPipelineConfig {
  chunkSize?: number;
  chunkOverlap?: number;
  topK?: number;
  retrievalMethod?: 'vector' | 'keyword' | 'hybrid';
  maxContextTokens?: number;
}

export class BasicRAGPipeline {
  protected chunker: TextChunker;
  protected vectorRetriever: VectorRetriever;
  protected keywordRetriever: KeywordRetriever;
  protected hybridRetriever: HybridRetriever;
  protected promptBuilder: PromptBuilder;
  protected contextAssembler: ContextAssembler;
  protected postProcessor: ResponsePostProcessor;
  protected config: Required<RAGPipelineConfig>;

  constructor(config: RAGPipelineConfig = {}) {
    this.config = {
      chunkSize: config.chunkSize || 1000,
      chunkOverlap: config.chunkOverlap || 200,
      topK: config.topK || 10,
      retrievalMethod: config.retrievalMethod || 'hybrid',
      maxContextTokens: config.maxContextTokens || 3000,
    };
    this.chunker = new TextChunker(this.config.chunkSize, this.config.chunkOverlap);
    this.vectorRetriever = new VectorRetriever();
    this.keywordRetriever = new KeywordRetriever();
    this.hybridRetriever = new HybridRetriever(this.vectorRetriever, this.keywordRetriever);
    this.promptBuilder = new PromptBuilder();
    this.contextAssembler = new ContextAssembler();
    this.postProcessor = new ResponsePostProcessor();
  }

  async process(query: string, queryEmbedding: number[], documents: Array<{ id: string; content: string }>): Promise<{ prompt: string; context: string; chunks: VectorSearchResult[] }> {
    let chunks: VectorSearchResult[];
    switch (this.config.retrievalMethod) {
      case 'vector':
        chunks = await this.vectorRetriever.retrieve(queryEmbedding, this.config.topK);
        break;
      case 'keyword':
        chunks = this.keywordRetriever.retrieve(query, documents);
        break;
      case 'hybrid':
      default:
        chunks = await this.hybridRetriever.retrieve(query, queryEmbedding, documents);
        break;
    }
    const context = this.contextAssembler.assemble(chunks, this.config.maxContextTokens);
    const prompt = this.promptBuilder.build(query, chunks);
    return { prompt, context, chunks };
  }
}

export class AdvancedRAGPipeline extends BasicRAGPipeline {
  async processWithGeneration(
    query: string,
    queryEmbedding: number[],
    documents: Array<{ id: string; content: string }>,
    generateFn: (prompt: string) => Promise<string>
  ): Promise<{ response: string; context: RAGContext }> {
    const { prompt, context, chunks } = await this.process(query, queryEmbedding, documents);
    const rawResponse = await generateFn(prompt);
    const response = this.postProcessor.process(rawResponse, chunks);
    return {
      response,
      context: {
        query,
        chunks,
        tokensUsed: context.split(/\s+/).length + response.split(/\s+/).length,
        model: 'gpt-4',
      },
    };
  }
}

export function createPipeline(config?: RAGPipelineConfig): BasicRAGPipeline {
  return new BasicRAGPipeline(config);
}