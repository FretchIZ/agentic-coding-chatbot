import OpenAI from 'openai';
import { AIModelProvider } from '@learning-platform/shared';
import type { AIMessage, ToolDefinition, ModelConfig, ModelResponse } from '@learning-platform/shared';
import { BaseModel } from './index';

export class OpenAIModel extends BaseModel {
  readonly provider = AIModelProvider.OPENAI;
  private client: OpenAI;

  constructor(public config: ModelConfig) {
    super();
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generate(messages: AIMessage[], tools?: ToolDefinition[]): Promise<ModelResponse> {
    const start = Date.now();
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: messages as any,
      tools: tools as any,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    });
    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      toolCalls: choice.message.tool_calls?.map(tc => ({
        id: tc.id,
        type: tc.type,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      model: response.model,
      latencyMs: Date.now() - start,
    };
  }

  async *stream(messages: AIMessage[], tools?: ToolDefinition[]): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages: messages as any,
      tools: tools as any,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}