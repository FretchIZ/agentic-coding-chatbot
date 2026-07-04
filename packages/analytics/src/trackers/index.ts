import { AnalyticsEventType, logger } from '@learning-platform/shared';

export interface AnalyticsEvent {
  userId: string;
  eventType: AnalyticsEventType;
  eventData: Record<string, unknown>;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

export class EventTracker {
  private buffer: AnalyticsEvent[] = [];
  private flushInterval: number;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(flushIntervalMs: number = 5000) {
    this.flushInterval = flushIntervalMs;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush();
  }

  track(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    this.buffer.push({ ...event, timestamp: new Date() });
    if (this.buffer.length >= 100) this.flush();
  }

  trackPageView(userId: string, page: string): void {
    this.track({ userId, eventType: AnalyticsEventType.PAGE_VIEW, eventData: { page } });
  }

  trackLessonStart(userId: string, lessonId: string): void {
    this.track({ userId, eventType: AnalyticsEventType.LESSON_START, eventData: { lessonId } });
  }

  trackLessonComplete(userId: string, lessonId: string, timeSpentMs: number): void {
    this.track({ userId, eventType: AnalyticsEventType.LESSON_COMPLETE, eventData: { lessonId, timeSpentMs } });
  }

  trackQuizAttempt(userId: string, quizId: string, score: number): void {
    this.track({ userId, eventType: AnalyticsEventType.QUIZ_ATTEMPT, eventData: { quizId, score } });
  }

  trackAIInteraction(userId: string, sessionId: string, agentType: string): void {
    this.track({ userId, eventType: AnalyticsEventType.AI_INTERACTION, eventData: { sessionId, agentType } });
  }

  trackError(userId: string | null, error: string, context?: Record<string, unknown>): void {
    this.track({
      userId: userId || 'anonymous',
      eventType: AnalyticsEventType.ERROR,
      eventData: { error, ...context },
    });
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const events = [...this.buffer];
    this.buffer = [];
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      logger.warn('Failed to flush analytics events', { count: events.length });
      this.buffer.unshift(...events.slice(-50));
    }
  }
}

export class ProgressTracker {
  async getUserProgress(userId: string): Promise<{
    completedLessons: number;
    totalLessons: number;
    completionRate: number;
    averageScore: number;
    totalTimeSpent: number;
  }> {
    const response = await fetch(`/api/analytics/progress/${userId}`);
    return response.json();
  }

  async updateProgress(userId: string, lessonId: string, progress: number): Promise<void> {
    await fetch(`/api/analytics/progress/${userId}/${lessonId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
    });
  }
}

export class EngagementTracker {
  async getUserEngagement(userId: string): Promise<{
    dailyActiveMinutes: number;
    weeklyActiveDays: number;
    sessionCount: number;
    averageSessionDuration: number;
  }> {
    const response = await fetch(`/api/analytics/engagement/${userId}`);
    return response.json();
  }
}

export class PerformanceTracker {
  async getPerformanceMetrics(userId: string): Promise<{
    quizAverageScore: number;
    codeSuccessRate: number;
    skillProgress: Record<string, number>;
    strengthAreas: string[];
    improvementAreas: string[];
  }> {
    const response = await fetch(`/api/analytics/performance/${userId}`);
    return response.json();
  }
}