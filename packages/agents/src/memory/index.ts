import type { Agent, AgentResult, AgentStatus, Task } from '../interfaces';

export class MemoryAgent implements Agent {
  id = 'memory';
  name = 'Memory Agent';
  description = 'Manages project context and long-term memory across sessions';
  type = 'memory' as const;
  private _status: AgentStatus = 'idle';

  async execute(task: Task): Promise<AgentResult> {
    this._status = 'running';
    try {
      const memoryEntry = [
        `## Memory: ${task.title}`,
        '',
        `**Context**: ${task.description || 'General'} `,
        `**Type**: ${task.type}`,
        `**Timestamp**: ${new Date().toISOString()}`,
        '',
        '### Stored Information',
        JSON.stringify(task.context || {}, null, 2),
      ].join('\n');

      this._status = 'idle';
      return { success: true, output: memoryEntry, summary: 'Memory stored successfully' };
    } catch (error) {
      this._status = 'error';
      return { success: false, output: '', error: String(error) };
    }
  }

  async cancel(): Promise<void> {
    this._status = 'idle';
  }

  status(): AgentStatus {
    return this._status;
  }
}
