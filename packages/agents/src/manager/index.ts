import type { Agent, AgentConfig, AgentResult, Task } from '../interfaces';
import type { AgentEvent } from '../types';
import { createLogger } from '@codeagent/telemetry';

const log = createLogger('AgentManager');

export type AgentEventCallback = (event: AgentEvent) => void;

export class AgentManager {
  private agents: Map<string, Agent> = new Map();
  private activeTasks: Map<string, AbortController> = new Map();
  private listeners: Set<AgentEventCallback> = new Set();
  private config: AgentConfig;

  constructor(config: AgentConfig = {}) {
    this.config = config;
  }

  register(agent: Agent): void {
    this.agents.set(agent.id, agent);
    log.info(`Agent registered: ${agent.name} (${agent.id})`);
  }

  unregister(agentId: string): void {
    this.agents.delete(agentId);
    log.info(`Agent unregistered: ${agentId}`);
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAgentsByType(type: string): Agent[] {
    return this.getAllAgents().filter((a) => a.type === type);
  }

  onEvent(callback: AgentEventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit(event: AgentEvent): void {
    this.listeners.forEach((cb) => cb(event));
  }

  async execute(task: Task, agentId?: string): Promise<AgentResult> {
    const agent = agentId ? this.agents.get(agentId) : null;
    if (!agent) {
      return { success: false, output: '', error: `Agent ${agentId || 'not specified'} not found` };
    }

    const controller = new AbortController();
    this.activeTasks.set(task.id, controller);

    this.emit({ type: 'started', agentId: agent.id, taskId: task.id, timestamp: Date.now() });

    try {
      const result = await agent.execute(task);
      this.emit({
        type: result.success ? 'completed' : 'error',
        agentId: agent.id,
        taskId: task.id,
        timestamp: Date.now(),
        data: result,
      });
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.emit({ type: 'error', agentId: agent.id, taskId: task.id, timestamp: Date.now(), data: errorMsg });
      return { success: false, output: '', error: errorMsg };
    } finally {
      this.activeTasks.delete(task.id);
    }
  }

  async executeWithOrchestration(tasks: Task[]): Promise<Map<string, AgentResult>> {
    const results = new Map<string, AgentResult>();
    for (const task of tasks) {
      const agentType = task.type;
      const agents = this.getAgentsByType(agentType);
      if (agents.length === 0) {
        results.set(task.id, { success: false, output: '', error: `No agent available for type: ${agentType}` });
        continue;
      }
      const result = await this.execute(task, agents[0].id);
      results.set(task.id, result);
    }
    return results;
  }

  async cancel(taskId: string): Promise<void> {
    const controller = this.activeTasks.get(taskId);
    if (controller) {
      controller.abort();
      this.activeTasks.delete(taskId);
    }
  }
}
