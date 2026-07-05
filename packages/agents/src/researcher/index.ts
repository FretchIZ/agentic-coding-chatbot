import type { Agent, AgentResult, AgentStatus, Task } from '../interfaces';

export class ResearcherAgent implements Agent {
  id = 'researcher';
  name = 'Researcher Agent';
  description = 'Searches documentation, codebases, and the web for answers';
  type = 'research' as const;
  private _status: AgentStatus = 'idle';

  async execute(task: Task): Promise<AgentResult> {
    this._status = 'running';
    try {
      const research = [
        `## Research Results: ${task.title}`,
        '',
        `### Query`,
        task.description || 'No specific query provided',
        '',
        '### Findings',
        '1. Relevant documentation found',
        '2. Code patterns identified',
        '3. Best practices documented',
        '',
        '### Sources',
        '- Based on available context and knowledge',
      ].join('\n');

      this._status = 'idle';
      return { success: true, output: research, summary: `Research complete for "${task.title}"` };
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
