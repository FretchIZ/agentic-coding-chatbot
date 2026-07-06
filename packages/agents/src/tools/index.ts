import type { Agent } from '../interfaces';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export interface MCPToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export function agentToTool(agent: Agent): MCPTool {
  return {
    name: agent.id,
    description: agent.description,
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: agent.description },
        context: { type: 'string', description: 'Optional additional context or instructions' },
      },
      required: ['task'],
    },
  };
}

export function agentsToTools(agents: Agent[]): MCPTool[] {
  return agents.map(agentToTool);
}
