import { AIModelProvider } from '@learning-platform/shared';
import type { AIMessage, ToolDefinition } from '@learning-platform/shared';

export interface ModelConfig {
  provider: AIModelProvider;
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stop?: string[];
}

export interface ModelResponse {
  content: string;
  toolCalls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  latencyMs: number;
}

export abstract class BaseModel {
  abstract readonly provider: AIModelProvider;
  abstract readonly config: ModelConfig;

  abstract generate(messages: AIMessage[], tools?: ToolDefinition[]): Promise<ModelResponse>;
  abstract stream(messages: AIMessage[], tools?: ToolDefinition[]): AsyncGenerator<string>;

  getDefaultConfig(): ModelConfig {
    return {
      provider: this.provider,
      model: this.config.model,
      maxTokens: 4096,
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    };
  }
}

export * from './openai';
export * from './claude';
export * from './local';