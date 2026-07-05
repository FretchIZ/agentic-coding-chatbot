import { AIModelProvider } from '@learning-platform/shared';
import type { AIMessage, ToolDefinition, ModelConfig, ModelResponse } from '@learning-platform/shared';

export type { ModelConfig, ModelResponse };

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

export { OpenAIModel } from './openai';
