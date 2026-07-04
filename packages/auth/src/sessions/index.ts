import { logger } from '@learning-platform/shared';

export class SessionStore {
  private sessions: Map<string, { userId: string; createdAt: Date; lastActivity: Date; data: Record<string, unknown> }> = new Map();

  create(sessionId: string, userId: string): void {
    const now = new Date();
    this.sessions.set(sessionId, { userId, createdAt: now, lastActivity: now, data: {} });
  }

  get(sessionId: string): { userId: string; createdAt: Date; lastActivity: Date; data: Record<string, unknown> } | undefined {
    const session = this.sessions.get(sessionId);
    if (session) session.lastActivity = new Date();
    return session;
  }

  update(sessionId: string, data: Record<string, unknown>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session.data, data);
      session.lastActivity = new Date();
    }
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  cleanup(maxAgeMs: number = 86400000): void {
    const cutoff = Date.now() - maxAgeMs;
    for (const [id, session] of this.sessions) {
      if (session.lastActivity.getTime() < cutoff) {
        this.sessions.delete(id);
        logger.info(`Cleaned up inactive session: ${id}`);
      }
    }
  }

  size(): number {
    return this.sessions.size;
  }
}

export class RateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(private maxAttempts: number = 5, private windowMs: number = 60000) {}

  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = this.attempts.get(key);
    if (!record || now > record.resetAt) {
      this.attempts.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.maxAttempts - 1, resetAt: now + this.windowMs };
    }
    if (record.count >= this.maxAttempts) {
      return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }
    record.count++;
    return { allowed: true, remaining: this.maxAttempts - record.count, resetAt: record.resetAt };
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}