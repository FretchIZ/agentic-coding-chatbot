import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { logger } from '@learning-platform/shared';
import { Orchestrator } from './orchestrator';
import { AgentRouter } from './handlers/router';

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws/agent' });
const orchestrator = new Orchestrator();
const router = new AgentRouter(orchestrator);

app.use(express.json({ limit: '10mb' }));

app.post('/api/agent/process', async (req, res) => {
  try {
    const { query, sessionId, agentType } = req.body;
    const result = await orchestrator.processQuery(query, sessionId, agentType);
    res.json(result);
  } catch (error) {
    logger.error('Agent processing error', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

app.get('/api/agent/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const state = orchestrator.getSessionState(sessionId);
  res.json({ sessionId, state: state || {} });
});

app.post('/api/agent/sessions/:sessionId/cancel', (req, res) => {
  const { sessionId } = req.params;
  orchestrator.cancelSession(sessionId);
  res.json({ message: `Session ${sessionId} cancelled` });
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'ai-agent', timestamp: new Date().toISOString() }));

wss.on('connection', (ws, req) => {
  logger.info('Agent WebSocket connected', { ip: req.socket.remoteAddress });
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      const result = await router.handleMessage(ws, message);
      ws.send(JSON.stringify(result));
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', content: 'Processing failed' }));
    }
  });
});

const PORT = parseInt(process.env.AGENT_PORT || '8001', 10);
httpServer.listen(PORT, () => logger.info(`AI Agent server listening on port ${PORT}`));

export { app, httpServer, wss };