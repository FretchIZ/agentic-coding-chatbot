import { OrchestratorAgent, TutorAgent, CodingAgent, ReviewerAgent, PlannerAgent, QuizAgent, DebuggerAgent, ResearchAgent, BaseAgent } from '@learning-platform/ai';
import { AgentType } from '@learning-platform/shared';

export class Orchestrator {
  private agents: Map<AgentType, BaseAgent>;
  private sessions: Map<string, { history: string[]; agentType: AgentType; cancelled: boolean }> = new Map();

  constructor() {
    this.agents = new Map();
  }

  registerAgent(type: AgentType, agent: BaseAgent): void {
    this.agents.set(type, agent);
  }

  async processQuery(query: string, sessionId?: string, agentType?: AgentType): Promise<{ content: string; sessionId: string; agentType: string }> {
    const session = sessionId || crypto.randomUUID();
    this.ensureSession(session, agentType || AgentType.TUTOR);

    const type = agentType || AgentType.TUTOR;
    const agent = this.agents.get(type) || this.agents.get(AgentType.TUTOR);
    if (!agent) return { content: 'No agent available', sessionId: session, agentType: type };

    const result = await agent.process(query);
    this.sessions.get(session)?.history.push(query, result.content);
    return { content: result.content, sessionId: session, agentType: type };
  }

  private ensureSession(sessionId: string, agentType: AgentType): void {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, { history: [], agentType, cancelled: false });
    }
  }

  getSessionState(sessionId: string) {
    return this.sessions.get(sessionId);
  }

  cancelSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) session.cancelled = true;
  }
}