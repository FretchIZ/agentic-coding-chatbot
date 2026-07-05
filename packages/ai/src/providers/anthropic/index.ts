import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import type { AIProviderInterface, AIConfig, ChatMessage, ChatCompletion } from '../../index';

export class AnthropicProvider implements AIProviderInterface {
  private client: ReturnType<typeof createAnthropic>;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.client = createAnthropic({ apiKey: config.apiKey });
  }

  async chat(messages: ChatMessage[], config?: Partial<AIConfig>): Promise<ChatCompletion> {
    const result = await generateText({
      model: this.client(config?.model || this.config.model),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      maxTokens: config?.maxTokens || this.config.maxTokens,
      temperature: config?.temperature ?? this.config.temperature ?? 0.7,
    });
    return { content: result.text, model: this.config.model, usage: result.usage };
  }
}
