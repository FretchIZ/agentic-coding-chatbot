export const agentConfig = {
  defaultModel: process.env.AI_MODEL || 'gpt-4',
  defaultProvider: process.env.AI_PROVIDER || 'openai',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2048', 10),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  timeouts: {
    tutor: 30000,
    coding: 60000,
    reviewer: 45000,
    planner: 30000,
    quiz: 30000,
    debugger: 60000,
    research: 90000,
    orchestrator: 60000,
  },
};