import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { AIProviderInterface, AIConfig, ChatMessage, ChatCompletion } from '../../index';

export class OpenAIProvider implements AIProviderInterface {
  private client: ReturnType<typeof createOpenAI>;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.client = createOpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl });
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
