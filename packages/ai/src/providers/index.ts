import { AIModelProvider } from '@learning-platform/shared';
import type { ModelConfig } from '@learning-platform/shared';

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel: string;
  models: string[];
}

export const providerConfigs: Record<AIModelProvider, ProviderConfig> = {
  [AIModelProvider.OPENAI]: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4-turbo-preview',
    models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo', 'gpt-4o'],
  },
  [AIModelProvider.ANTHROPIC]: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-opus-20240229',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  },
  [AIModelProvider.VERCEL]: {
    baseUrl: '/api/ai',
    defaultModel: 'gpt-4-turbo-preview',
    models: ['gpt-4-turbo-preview', 'claude-3-opus-20240229'],
  },
  [AIModelProvider.LOCAL]: {
    baseUrl: process.env.LOCAL_AI_URL || 'http://localhost:11434',
    defaultModel: 'llama3',
    models: ['llama3', 'mistral', 'codellama', 'mixtral'],
  },
};

export function getDefaultModelConfig(provider: AIModelProvider): ModelConfig {
  const config = providerConfigs[provider];
  return {
    provider,
    model: config.defaultModel,
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  };
}

export function getAvailableModels(provider: AIModelProvider): string[] {
  return providerConfigs[provider]?.models || [];
}

