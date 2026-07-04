import type { AIMessage } from '@learning-platform/shared';

export interface SessionState {
  id: string;
  userId: string;
  type: string;
  startedAt: Date;
  messages: AIMessage[];
  context: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export class SessionManager {
  private sessions: Map<string, SessionState> = new Map();

  createSession(userId: string, type: string): SessionState {
    const session: SessionState = {
      id: crypto.randomUUID(),
      userId,
      type,
      startedAt: new Date(),
      messages: [],
      context: {},
      metadata: {},
    };
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(id: string): SessionState | undefined {
    return this.sessions.get(id);
  }

  updateSession(id: string, updates: Partial<SessionState>): SessionState | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    Object.assign(session, updates);
    return session;
  }

  addMessage(sessionId: string, message: AIMessage): void {
    const session = this.sessions.get(sessionId);
    if (session) session.messages.push(message);
  }

  endSession(id: string): void {
    const session = this.sessions.get(id);
    if (session) session.metadata.endedAt = new Date().toISOString();
  }

  getSessionsByUser(userId: string): SessionState[] {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }

  cleanupOldSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs;
    for (const [id, session] of this.sessions) {
      if (session.startedAt.getTime() < cutoff) this.sessions.delete(id);
    }
  }
}

export class ContextBuilder {
  private context: Record<string, unknown> = {};

  set(key: string, value: unknown): void {
    this.context[key] = value;
  }

  get(key: string): unknown {
    return this.context[key];
  }

  merge(data: Record<string, unknown>): void {
    Object.assign(this.context, data);
  }

  build(): Record<string, unknown> {
    return { ...this.context };
  }

  clear(): void {
    this.context = {};
  }
}