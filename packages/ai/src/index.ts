export type AIModel = 'gpt-4o' | 'gpt-4o-mini' | 'claude-3-5-sonnet' | 'claude-3-5-haiku' | 'gemini-2-0-flash' | 'deepseek-coder' | 'openrouter' | 'ollama';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'openrouter' | 'ollama';

export interface AIConfig {
  provider: AIProvider;
  model: AIModel;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletion {
  content: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface AIProviderInterface {
  chat(messages: ChatMessage[], config?: Partial<AIConfig>): Promise<ChatCompletion>;
  stream?(messages: ChatMessage[], config?: Partial<AIConfig>): AsyncIterable<string>;
}

export function createProvider(config: AIConfig): AIProviderInterface {
  switch (config.provider) {
    case 'openai':
      return new (require('./providers/openai').OpenAIProvider)(config);
    case 'anthropic':
      return new (require('./providers/anthropic').AnthropicProvider)(config);
    case 'google':
      return new (require('./providers/google').GoogleProvider)(config);
    case 'deepseek':
      return new (require('./providers/deepseek').DeepSeekProvider)(config);
    case 'openrouter':
      return new (require('./providers/openrouter').OpenRouterProvider)(config);
    case 'ollama':
      return new (require('./providers/ollama').OllamaProvider)(config);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
