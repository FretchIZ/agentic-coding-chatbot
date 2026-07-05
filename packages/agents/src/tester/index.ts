import type { Agent, AgentResult, AgentStatus, Task } from '../interfaces';

export class TesterAgent implements Agent {
  id = 'tester';
  name = 'Tester Agent';
  description = 'Generates and runs tests for code changes';
  type = 'test' as const;
  private _status: AgentStatus = 'idle';

  async execute(task: Task): Promise<AgentResult> {
    this._status = 'running';
    try {
      const testCode = [
        `import { describe, it, expect } from 'vitest';`,
        '',
        `describe('${task.title}', () => {`,
        `  it('should work as expected', () => {`,
        `    expect(true).toBe(true);`,
        `  });`,
        `});`,
        '',
      ].join('\n');

      this._status = 'idle';
      return {
        success: true,
        output: testCode,
        files: [{ path: `${task.id}.test.ts`, content: testCode, action: 'create' as const }],
        summary: 'Generated test suite',
      };
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
