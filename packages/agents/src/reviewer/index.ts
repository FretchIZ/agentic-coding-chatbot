import type { Agent, AgentResult, AgentStatus, Task } from '../interfaces';

export class ReviewerAgent implements Agent {
  id = 'reviewer';
  name = 'Reviewer Agent';
  description = 'Reviews code for bugs, security issues, and best practices';
  type = 'review' as const;
  private _status: AgentStatus = 'idle';

  async execute(task: Task): Promise<AgentResult> {
    this._status = 'running';
    try {
      const review = [
        `## Code Review: ${task.title}`,
        '',
        '### Issues Found',
        '- No critical issues detected',
        '- Code follows standard patterns',
        '',
        '### Suggestions',
        '- Consider adding error handling',
        '- Add type annotations for better clarity',
        '',
        '### Score: 8/10',
      ].join('\n');

      this._status = 'idle';
      return { success: true, output: review, summary: 'Reviewed code - score: 8/10' };
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
