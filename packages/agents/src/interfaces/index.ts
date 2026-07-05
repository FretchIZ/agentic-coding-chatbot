export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, unknown>;
  files?: string[];
}

export type TaskType = 'code' | 'review' | 'test' | 'search' | 'plan' | 'research' | 'memory';

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error';

export interface AgentResult {
  success: boolean;
  output: string;
  summary?: string;
  files?: Array<{ path: string; content: string; action: 'create' | 'modify' | 'delete' }>;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  execute(task: Task): Promise<AgentResult>;
  cancel(): Promise<void>;
  status(): AgentStatus;
}

export interface AgentConfig {
  maxRetries?: number;
  timeout?: number;
  model?: string;
  temperature?: number;
}
