import type { Agent, AgentResult, AgentStatus, Task } from '../interfaces';

export class PlannerAgent implements Agent {
  id = 'planner';
  name = 'Planner Agent';
  description = 'Breaks down tasks into actionable steps and creates development plans';
  type = 'plan' as const;
  private _status: AgentStatus = 'idle';

  async execute(task: Task): Promise<AgentResult> {
    this._status = 'running';
    try {
      const plan = [
        `## Plan for: ${task.title}`,
        '',
        '### Steps',
        '1. Analyze requirements',
        '2. Design solution architecture',
        '3. Implement changes',
        '4. Test and verify',
        '5. Review and optimize',
        '',
        `### Context: ${task.description || 'No description provided'}`,
      ].join('\n');

      this._status = 'idle';
      return { success: true, output: plan, summary: `Created plan with 5 steps for "${task.title}"` };
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
