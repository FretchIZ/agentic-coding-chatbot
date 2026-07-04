import { WebSocket } from 'ws';
import { Orchestrator } from '../orchestrator';
import { AgentType, logger } from '@learning-platform/shared';

export class AgentRouter {
  constructor(private orchestrator: Orchestrator) {}

  async handleMessage(ws: WebSocket, message: { type: string; payload: Record<string, unknown> }): Promise<Record<string, unknown>> {
    switch (message.type) {
      case 'query':
        return this.handleQuery(message.payload);
      case 'cancel':
        return this.handleCancel(message.payload);
      case 'status':
        return this.handleStatus(message.payload);
      default:
        return { type: 'error', content: `Unknown message type: ${message.type}` };
    }
  }

  private async handleQuery(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const query = payload.query as string;
    const sessionId = payload.sessionId as string;
    const agentType = payload.agentType as AgentType;
    try {
      const result = await this.orchestrator.processQuery(query, sessionId, agentType);
      return { type: 'result', ...result };
    } catch (error) {
      logger.error('Query handler error', error);
      return { type: 'error', content: 'Failed to process query' };
    }
  }

  private handleCancel(payload: Record<string, unknown>): Record<string, unknown> {
    const sessionId = payload.sessionId as string;
    this.orchestrator.cancelSession(sessionId);
    return { type: 'cancelled', sessionId };
  }

  private handleStatus(payload: Record<string, unknown>): Record<string, unknown> {
    const sessionId = payload.sessionId as string;
    const state = this.orchestrator.getSessionState(sessionId);
    return { type: 'status', sessionId, state: state || null };
  }
}