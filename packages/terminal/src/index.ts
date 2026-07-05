export interface TerminalOptions {
  cwd?: string;
  env?: Record<string, string>;
  shell?: string;
}

export interface TerminalOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface TerminalSession {
  id: string;
  cwd: string;
  write(data: string): Promise<void>;
  resize(cols: number, rows: number): Promise<void>;
  kill(): Promise<void>;
  onData(callback: (data: string) => void): () => void;
  onExit(callback: (code: number) => void): () => void;
}

export interface TerminalProvider {
  createSession(options?: TerminalOptions): Promise<TerminalSession>;
  execute(command: string, options?: TerminalOptions): Promise<TerminalOutput>;
  getSession(id: string): TerminalSession | undefined;
  destroySession(id: string): Promise<void>;
}

export class LocalTerminal implements TerminalProvider {
  private sessions = new Map<string, TerminalSession>();

  async createSession(options?: TerminalOptions): Promise<TerminalSession> {
    const id = `term_${Date.now()}`;
    const session: TerminalSession = {
      id,
      cwd: options?.cwd || process.cwd(),
      async write(data: string) {},
      async resize(cols: number, rows: number) {},
      async kill() {},
      onData(callback: (data: string) => void) {
        return () => {};
      },
      onExit(callback: (code: number) => void) {
        return () => {};
      },
    };
    this.sessions.set(id, session);
    return session;
  }

  async execute(command: string, options?: TerminalOptions): Promise<TerminalOutput> {
    try {
      const proc = require('child_process').execSync(command, {
        cwd: options?.cwd,
        env: { ...process.env, ...options?.env },
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { stdout: proc.stdout || '', stderr: proc.stderr || '', exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message || String(error),
        exitCode: error.status ?? 1,
      };
    }
  }

  getSession(id: string): TerminalSession | undefined {
    return this.sessions.get(id);
  }

  async destroySession(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      await session.kill();
      this.sessions.delete(id);
    }
  }
}
