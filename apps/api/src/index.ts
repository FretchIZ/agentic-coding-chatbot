import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { AgentManager, PlannerAgent, CoderAgent, ReviewerAgent, TesterAgent } from '@codeagent/agents';
import type { Task } from '@codeagent/agents';
import { createLogger } from '@codeagent/telemetry';

const log = createLogger('API');
const app = new Hono();

const manager = new AgentManager();
manager.register(new PlannerAgent());
manager.register(new CoderAgent());
manager.register(new ReviewerAgent());
manager.register(new TesterAgent());

app.use('*', cors());
app.use('*', logger());

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/agents', (c) => {
  const agents = manager.getAllAgents().map((a) => ({
    id: a.id, name: a.name, description: a.description, type: a.type, status: a.status(),
  }));
  return c.json({ agents });
});

app.post('/agents/:id/execute', async (c) => {
  const agentId = c.req.param('id');
  const body = await c.req.json<Task>();
  const result = await manager.execute(body, agentId);
  return c.json(result);
});

app.post('/tasks', async (c) => {
  const body = await c.req.json<Task>();
  const result = await manager.execute(body, 'coder');
  return c.json(result);
});

app.post('/tasks/orchestrate', async (c) => {
  const { tasks } = await c.req.json<{ tasks: Task[] }>();
  const results = await manager.executeWithOrchestration(tasks);
  const output = Array.from(results.entries()).map(([id, result]) => ({ taskId: id, ...result }));
  return c.json({ results: output });
});

app.get('/memory/:key', async (c) => {
  const { InMemoryStore } = await import('@codeagent/memory');
  const store = new InMemoryStore();
  const entry = await store.get(c.req.param('key'), c.req.query('projectId'));
  return c.json(entry || { error: 'not found' }, entry ? 200 : 404);
});

app.post('/memory', async (c) => {
  const { InMemoryStore } = await import('@codeagent/memory');
  const body = await c.req.json<{ key: string; value: string; projectId?: string }>();
  const store = new InMemoryStore();
  const entry = await store.set(body.key, body.value, { projectId: body.projectId });
  return c.json(entry, 201);
});

const port = parseInt(process.env.PORT || '3001', 10);
log.info(`Starting API server on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
