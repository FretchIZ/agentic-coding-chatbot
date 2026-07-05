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

export async function createProvider(config: AIConfig): Promise<AIProviderInterface> {
  switch (config.provider) {
    case 'openai': {
      const { OpenAIProvider } = await import('./providers/openai');
      return new OpenAIProvider(config);
    }
    case 'anthropic': {
      const { AnthropicProvider } = await import('./providers/anthropic');
      return new AnthropicProvider(config);
    }
    case 'google': {
      const { GoogleProvider } = await import('./providers/google');
      return new GoogleProvider(config);
    }
    case 'deepseek': {
      const { DeepSeekProvider } = await import('./providers/deepseek');
      return new DeepSeekProvider(config);
    }
    case 'openrouter': {
      const { OpenRouterProvider } = await import('./providers/openrouter');
      return new OpenRouterProvider(config);
    }
    case 'ollama': {
      const { OllamaProvider } = await import('./providers/ollama');
      return new OllamaProvider(config);
    }
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
