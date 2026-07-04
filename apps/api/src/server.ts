import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { logger } from '@learning-platform/shared';
import { authRouter } from './routes/auth';
import { chatRouter } from './routes/chat';
import { courseRouter } from './routes/course';
import { analyticsRouter } from './routes/analytics';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws/chat' });

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 60000, max: 100 }));
app.use(requestLogger);

app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/courses', courseRouter);
app.use('/api/analytics', analyticsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(errorHandler);

wss.on('connection', (ws, req) => {
  logger.info('WebSocket client connected', { ip: req.socket.remoteAddress });
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      wss.clients.forEach(client => {
        if (client.readyState === ws.OPEN) client.send(JSON.stringify(message));
      });
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', content: 'Invalid message format' }));
    }
  });
  ws.on('close', () => logger.info('WebSocket client disconnected'));
});

const PORT = parseInt(process.env.API_PORT || '8000', 10);
httpServer.listen(PORT, () => logger.info(`API server listening on port ${PORT}`));

export { app, httpServer, wss };