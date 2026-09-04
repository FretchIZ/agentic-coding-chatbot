import express, { Express } from 'express';
import { createClient } from 'redis';
import { getPrisma } from '@codeagent/database';
import {
  AuthService,
  RateLimiter,
  createMiddleware,
  Logger,
} from '@codeagent/shared';
import routes from './routes';

const logger = new Logger('API-Server');

/**
 * Initialize and configure Express server with production-grade middleware
 */
export async function createServer(): Promise<Express> {
  const app = express();

  // ============================================================================
  // Health Check
  // ============================================================================

  app.get('/', (req, res) => {
    res.json({ service: 'API', status: 'running' });
  });

  // ============================================================================
  // Pre-Request Setup
  // ============================================================================

  // Trust proxy (for rate limiting by client IP)
  app.set('trust proxy', 1);

  // ============================================================================
  // Body Parsing
  // ============================================================================

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // ============================================================================
  // Initialize Services
  // ============================================================================

  let redis;
  try {
    redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    redis.on('error', (err) => logger.error('Redis error', err));
    await redis.connect();
    logger.info('Connected to Redis');
  } catch (error) {
    logger.warn('Redis not available, proceeding without cache', error);
  }

  const authService = new AuthService();
  const rateLimiter = new RateLimiter(redis);
  const middleware = createMiddleware(redis, authService, rateLimiter);

  // ============================================================================
  // Middleware Pipeline
  // ============================================================================

  // 1. Request logging
  app.use(middleware.requestLogger);

  // 2. Security headers
  app.use(middleware.securityHeaders);

  // 3. CORS
  app.use(middleware.corsMiddleware);

  // 4. Request ID (for tracing)
  app.use((req, res, next) => {
    req.id = req.headers['x-request-id'] as string || generateRequestId();
    res.setHeader('X-Request-ID', req.id);
    next();
  });

  // 5. Authentication
  app.use(middleware.authenticateRequest);

  // 6. Rate limiting
  app.use(middleware.applyRateLimit);

  // 7. Request timeout
  app.use((req, res, next) => {
    res.setTimeout(30000, () => {
      res.status(408).json({
        error: {
          code: 'REQUEST_TIMEOUT',
          message: 'Request timeout',
        },
      });
    });
    next();
  });

  // ============================================================================
  // API Routes
  // ============================================================================

  app.use('/api/v1', routes);

  // ============================================================================
  // 404 Handler
  // ============================================================================

  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
      },
    });
  });

  // ============================================================================
  // Global Error Handler
  // ============================================================================

  app.use(middleware.errorHandler);

  // ============================================================================
  // Graceful Shutdown
  // ============================================================================

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    
    try {
      if (redis) {
        await redis.quit();
      }
      const prisma = getPrisma();
      await prisma.$disconnect();
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', error);
      process.exit(1);
    }
  });

  return app;
}

/**
 * Start server
 */
export async function startServer() {
  try {
    const app = await createServer();
    const port = parseInt(process.env.PORT || '3001', 10);

    app.listen(port, '0.0.0.0', () => {
      logger.info(`API server listening on port ${port}`);
    });
  } catch (error) {
    logger.fatal('Failed to start server', error);
    process.exit(1);
  }
}

function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Start if run directly
if (require.main === module) {
  startServer();
}
