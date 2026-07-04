import type { AIMessage, ModelResponse } from '@learning-platform/shared';
import { AgentType, logger } from '@learning-platform/shared';
import { BaseAgent, createAgent, BaseModel, createDefaultTools, systemPrompts } from '@learning-platform/ai';

export interface WorkflowNode {
  id: string;
  type: 'input' | 'process' | 'decision' | 'output' | 'memory' | 'search' | 'rag' | 'agent';
  execute(context: WorkflowContext): Promise<WorkflowContext>;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: (context: WorkflowContext) => boolean;
}

export interface WorkflowContext {
  input: string;
  output?: string;
  messages: AIMessage[];
  agentResponses: Map<string, ModelResponse>;
  memory: Map<string, unknown>;
  metadata: Record<string, unknown>;
}

export class WorkflowGraph {
  private nodes: Map<string, WorkflowNode> = new Map();
  private edges: WorkflowEdge[] = [];
  private entryNode: string = '';

  constructor(name: string) {}

  addNode(node: WorkflowNode): void {
    this.nodes.set(node.id, node);
    if (!this.entryNode) this.entryNode = node.id;
  }

  addEdge(edge: WorkflowEdge): void {
    this.edges.push(edge);
  }

  setEntryPoint(nodeId: string): void {
    this.entryNode = nodeId;
  }

  async execute(input: string): Promise<WorkflowContext> {
    const context: WorkflowContext = {
      input,
      messages: [],
      agentResponses: new Map(),
      memory: new Map(),
      metadata: {},
    };

    let currentNodeId = this.entryNode;
    const visited = new Set<string>();

    while (currentNodeId) {
      if (visited.has(currentNodeId)) {
        logger.warn(`Cycle detected at node: ${currentNodeId}`);
        break;
      }
      visited.add(currentNodeId);

      const node = this.nodes.get(currentNodeId);
      if (!node) break;

      const newContext = await node.execute(context);
      Object.assign(context, newContext);

      const nextEdge = this.edges.find(e => e.from === currentNodeId && (!e.condition || e.condition(context)));
      currentNodeId = nextEdge?.to || '';
    }

    return context;
  }
}

export class TutorWorkflow extends WorkflowGraph {
  constructor(tutorAgent: BaseAgent, ragNode: WorkflowNode) {
    super('tutor-workflow');
    this.addNode({ id: 'input', type: 'input', execute: async (ctx) => ctx });
    this.addNode(ragNode);
    this.addNode({ id: 'tutor', type: 'agent', execute: async (ctx) => {
      const response = await tutorAgent.process(ctx.input);
      ctx.agentResponses.set('tutor', response);
      ctx.output = response.content;
      return ctx;
    }});
    this.addNode({ id: 'output', type: 'output', execute: async (ctx) => ctx });
    this.setEntryPoint('input');
    this.addEdge({ from: 'input', to: 'rag' });
    this.addEdge({ from: 'rag', to: 'tutor' });
    this.addEdge({ from: 'tutor', to: 'output' });
  }
}

export class CodingWorkflow extends WorkflowGraph {
  constructor(codingAgent: BaseAgent) {
    super('coding-workflow');
    this.addNode({ id: 'input', type: 'input', execute: async (ctx) => ctx });
    this.addNode({ id: 'analyze', type: 'process', execute: async (ctx) => ctx });
    this.addNode({ id: 'generate', type: 'agent', execute: async (ctx) => {
      const response = await codingAgent.process(ctx.input);
      ctx.agentResponses.set('coding', response);
      ctx.output = response.content;
      return ctx;
    }});
    this.addNode({ id: 'output', type: 'output', execute: async (ctx) => ctx });
    this.setEntryPoint('input');
    this.addEdge({ from: 'input', to: 'analyze' });
    this.addEdge({ from: 'analyze', to: 'generate' });
    this.addEdge({ from: 'generate', to: 'output' });
  }
}

export class ReviewWorkflow extends WorkflowGraph {
  constructor(reviewerAgent: BaseAgent) {
    super('review-workflow');
    this.addNode({ id: 'input', type: 'input', execute: async (ctx) => ctx });
    this.addNode({ id: 'review', type: 'agent', execute: async (ctx) => {
      const response = await reviewerAgent.process(ctx.input);
      ctx.agentResponses.set('reviewer', response);
      ctx.output = response.content;
      return ctx;
    }});
    this.addNode({ id: 'output', type: 'output', execute: async (ctx) => ctx });
    this.setEntryPoint('input');
    this.addEdge({ from: 'input', to: 'review' });
    this.addEdge({ from: 'review', to: 'output' });
  }
}

export class QuizWorkflow extends WorkflowGraph {
  constructor(quizAgent: BaseAgent) {
    super('quiz-workflow');
    this.addNode({ id: 'input', type: 'input', execute: async (ctx) => ctx });
    this.addNode({ id: 'generate', type: 'agent', execute: async (ctx) => {
      const response = await quizAgent.process(ctx.input);
      ctx.agentResponses.set('quiz', response);
      ctx.output = response.content;
      return ctx;
    }});
    this.addNode({ id: 'validate', type: 'process', execute: async (ctx) => ctx });
    this.addNode({ id: 'output', type: 'output', execute: async (ctx) => ctx });
    this.setEntryPoint('input');
    this.addEdge({ from: 'input', to: 'generate' });
    this.addEdge({ from: 'generate', to: 'validate' });
    this.addEdge({ from: 'validate', to: 'output' });
  }
}