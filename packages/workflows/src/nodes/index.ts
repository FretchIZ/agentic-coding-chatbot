import type { AIMessage } from '@learning-platform/shared';
import { type WorkflowNode, type WorkflowContext } from '../graphs';

export class MemoryNode implements WorkflowNode {
  id = 'memory';
  type = 'memory' as const;

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    const lastMessages = context.messages.slice(-10);
    context.memory.set('recent_context', lastMessages);
    context.memory.set('session_id', crypto.randomUUID());
    return context;
  }
}

export class SearchNode implements WorkflowNode {
  id = 'search';
  type = 'search' as const;

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    const searchResults = await this.performSearch(context.input);
    context.memory.set('search_results', searchResults);
    context.metadata.searchPerformed = true;
    return context;
  }

  private async performSearch(query: string): Promise<string[]> {
    return [`Search results for: ${query}`];
  }
}

export class RAGNode implements WorkflowNode {
  id = 'rag';
  type = 'rag' as const;

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    const retrievedContext = await this.retrieveContext(context.input);
    context.memory.set('rag_context', retrievedContext);
    context.metadata.ragUsed = true;
    return context;
  }

  private async retrieveContext(query: string): Promise<string> {
    return `Retrieved context for: ${query}`;
  }
}

export class DecisionNode implements WorkflowNode {
  id = 'decision';
  type = 'decision' as const;

  constructor(
    private conditionFn: (context: WorkflowContext) => boolean,
    private trueNode: string,
    private falseNode: string
  ) {}

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    const result = this.conditionFn(context);
    context.metadata.decision = result ? 'true' : 'false';
    context.metadata.nextNode = result ? this.trueNode : this.falseNode;
    return context;
  }
}

export function createInputNode(id: string): WorkflowNode {
  return { id, type: 'input', execute: async (ctx) => ctx };
}

export function createOutputNode(id: string): WorkflowNode {
  return { id, type: 'output', execute: async (ctx) => ctx };
}

export function createProcessNode(id: string, processor: (ctx: WorkflowContext) => Promise<WorkflowContext>): WorkflowNode {
  return { id, type: 'process', execute: processor };
}