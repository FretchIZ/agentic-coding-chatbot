import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import type { AIProviderInterface, AIConfig, ChatMessage, ChatCompletion } from '../../index';

export class GoogleProvider implements AIProviderInterface {
  private client: ReturnType<typeof createGoogleGenerativeAI>;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.client = createGoogleGenerativeAI({ apiKey: config.apiKey });
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
