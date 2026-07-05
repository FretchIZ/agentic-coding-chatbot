export interface AgentCapability {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AgentContext {
  projectId?: string;
  userId: string;
  tokenLimit?: number;
  availableTools?: string[];
  workspaceRoot?: string;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface AgentConversation {
  id: string;
  agentId: string;
  messages: AgentMessage[];
  context: AgentContext;
  createdAt: number;
  updatedAt: number;
}

export type AgentEventType =
  | 'started'
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'output'
  | 'error'
  | 'completed'
  | 'cancelled';

export interface AgentEvent {
  type: AgentEventType;
  agentId: string;
  taskId: string;
  timestamp: number;
  data?: unknown;
}
