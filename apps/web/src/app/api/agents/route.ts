import { NextResponse } from 'next/server';
import { AgentManager, PlannerAgent, CoderAgent, ReviewerAgent, TesterAgent, agentsToTools } from '@codeagent/agents';

export const dynamic = 'force-dynamic';

const manager = new AgentManager();
manager.register(new PlannerAgent());
manager.register(new CoderAgent());
manager.register(new ReviewerAgent());
manager.register(new TesterAgent());

export async function GET() {
  const agents = manager.getAllAgents();
  const tools = agentsToTools(agents);
  return NextResponse.json({ agents, tools });
}
