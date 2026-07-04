import { AgentType } from '@learning-platform/shared';
import type { AIMessage, ToolDefinition, ModelResponse } from '@learning-platform/shared';
import { BaseModel } from '../models/base';
import { Tool } from '../tools';
import { logger } from '@learning-platform/shared';

export interface AgentConfig {
  type: AgentType;
  model: BaseModel;
  tools: Tool[];
  systemPrompt: string;
  maxIterations?: number;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected conversation: AIMessage[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
  }

  abstract get name(): string;
  abstract get description(): string;

  async initialize(): Promise<void> {
    this.conversation = [{ role: 'system', content: this.config.systemPrompt }];
  }

  async process(input: string): Promise<ModelResponse> {
    this.conversation.push({ role: 'user', content: input });
    const iteration = this.config.maxIterations || 5;
    for (let i = 0; i < iteration; i++) {
      const response = await this.config.model.generate(this.conversation, this.getToolDefinitions());
      if (response.toolCalls?.length) {
        for (const tc of response.toolCalls) {
          this.conversation.push({ role: 'assistant', content: '', toolCalls: [tc] });
          const tool = this.config.tools.find(t => t.definition.function.name === tc.function.name);
          if (tool) {
            try {
              const args = JSON.parse(tc.function.arguments);
              const result = await tool.execute(args);
              this.conversation.push({ role: 'tool', content: JSON.stringify(result), toolCallId: tc.id });
            } catch (error) {
              logger.error('Tool execution failed', error as Error, { tool: tc.function.name });
              this.conversation.push({ role: 'tool', content: `Error: ${error}`, toolCallId: tc.id });
            }
          }
        }
      } else {
        this.conversation.push({ role: 'assistant', content: response.content });
        return response;
      }
    }
    return this.config.model.generate(this.conversation);
  }

  async *stream(input: string): AsyncGenerator<string> {
    this.conversation.push({ role: 'user', content: input });
    const stream = this.config.model.stream(this.conversation, this.getToolDefinitions());
    let fullContent = '';
    for await (const chunk of stream) {
      fullContent += chunk;
      yield chunk;
    }
    this.conversation.push({ role: 'assistant', content: fullContent });
  }

  private getToolDefinitions(): ToolDefinition[] {
    return this.config.tools.map(t => t.definition);
  }

  clearConversation(): void {
    this.conversation = [{ role: 'system', content: this.config.systemPrompt }];
  }
}

export class TutorAgent extends BaseAgent {
  get name(): string { return 'Tutor'; }
  get description(): string { return 'Explains concepts and provides personalized guidance'; }
}

export class CodingAgent extends BaseAgent {
  get name(): string { return 'Coding Assistant'; }
  get description(): string { return 'Helps write, review, and debug code'; }
}

export class ReviewerAgent extends BaseAgent {
  get name(): string { return 'Code Reviewer'; }
  get description(): string { return 'Reviews code for quality, security, and best practices'; }
}

export class PlannerAgent extends BaseAgent {
  get name(): string { return 'Learning Planner'; }
  get description(): string { return 'Creates personalized learning paths'; }
}

export class QuizAgent extends BaseAgent {
  get name(): string { return 'Quiz Generator'; }
  get description(): string { return 'Generates assessments and quizzes'; }
}

export class DebuggerAgent extends BaseAgent {
  get name(): string { return 'Debugger'; }
  get description(): string { return 'Helps find and fix bugs in code'; }
}

export class ResearchAgent extends BaseAgent {
  get name(): string { return 'Research Assistant'; }
  get description(): string { return 'Finds and summarizes information'; }
}

export class OrchestratorAgent {
  private agents: Map<AgentType, BaseAgent> = new Map();

  constructor(agents: BaseAgent[]) {
    for (const agent of agents) {
      this.agents.set(agent.config.type, agent);
    }
  }

  getAgent(type: AgentType): BaseAgent | undefined {
    return this.agents.get(type);
  }

  async route(input: string): Promise<{ agent: AgentType; response: ModelResponse }> {
    const routingPrompt: AIMessage[] = [
      { role: 'system', content: 'Route the user query to the appropriate agent. Respond with only the agent name.' },
      { role: 'user', content: input },
    ];
    const response = await this.agents.get(AgentType.ORCHESTRATOR)?.config.model.generate(routingPrompt);
    const agentType = this.parseAgentType(response?.content || '');
    const agent = this.agents.get(agentType);
    if (!agent) throw new Error(`No agent found for type: ${agentType}`);
    const agentResponse = await agent.process(input);
    return { agent: agentType, response: agentResponse };
  }

  private parseAgentType(content: string): AgentType {
    const cleaned = content.toLowerCase().trim();
    if (cleaned.includes('tutor')) return AgentType.TUTOR;
    if (cleaned.includes('coding') || cleaned.includes('code')) return AgentType.CODING;
    if (cleaned.includes('review')) return AgentType.REVIEWER;
    if (cleaned.includes('plan') || cleaned.includes('path')) return AgentType.PLANNER;
    if (cleaned.includes('quiz') || cleaned.includes('question')) return AgentType.QUIZ;
    if (cleaned.includes('debug') || cleaned.includes('bug')) return AgentType.DEBUGGER;
    if (cleaned.includes('research') || cleaned.includes('search')) return AgentType.RESEARCH;
    return AgentType.TUTOR;
  }
}

export function createAgent(type: AgentType, model: BaseModel, tools: Tool[], systemPrompt: string): BaseAgent {
  switch (type) {
    case AgentType.TUTOR: return new TutorAgent({ type, model, tools, systemPrompt });
    case AgentType.CODING: return new CodingAgent({ type, model, tools, systemPrompt });
    case AgentType.REVIEWER: return new ReviewerAgent({ type, model, tools, systemPrompt });
    case AgentType.PLANNER: return new PlannerAgent({ type, model, tools, systemPrompt });
    case AgentType.QUIZ: return new QuizAgent({ type, model, tools, systemPrompt });
    case AgentType.DEBUGGER: return new DebuggerAgent({ type, model, tools, systemPrompt });
    case AgentType.RESEARCH: return new ResearchAgent({ type, model, tools, systemPrompt });
    default: throw new Error(`Unknown agent type: ${type}`);
  }
}