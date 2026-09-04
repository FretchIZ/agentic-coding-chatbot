import express, { Router } from 'express';
import { createClient } from 'redis';
import { getPrisma } from '@codeagent/database';
import {
  AuthService,
  RateLimiter,
  createMiddleware,
  ValidationSchemas,
  sendSuccess,
  sendPaginated,
  AppError,
  AuthenticatedRequest,
} from '@codeagent/shared';
import { logAudit, hasProjectAccess } from '@codeagent/shared';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

const authService = new AuthService();
const rateLimiter = new RateLimiter(redis);
const middleware = createMiddleware(redis, authService, rateLimiter);

const router = Router();
const prisma = getPrisma();

// ============================================================================
// Health & Status
// ============================================================================

router.get('/health', (req, res) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// Authentication Routes
// ============================================================================

/**
 * POST /auth/signup
 * Register a new user
 */
router.post(
  '/auth/signup',
  middleware.validate(ValidationSchemas.signup),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { email, password, name } = req.body;

      // Check if user exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new AppError(409, 'USER_EXISTS', 'Email already registered');
      }

      // Hash password (in production, use bcrypt)
      const passwordHash = Buffer.from(password).toString('base64');

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          sessions: {
            create: {
              token: Buffer.from(Math.random().toString()).toString('hex'),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
          },
          rateLimit: {
            create: {
              tier: 'FREE',
            },
          },
          billingAccount: {
            create: {
              plan: 'FREE',
            },
          },
        },
        include: { sessions: true },
      });

      // Log audit event
      await logAudit(user.id, 'CREATE', 'User', user.id, undefined, req.ip);

      const token = user.sessions[0].token;

      sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      }, 201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/login
 * Authenticate user
 */
router.post(
  '/auth/login',
  middleware.validate(ValidationSchemas.login),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { email, password } = req.body;

      // Find user (in production, verify password hash properly)
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.passwordHash) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }

      // Create session
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          token: Buffer.from(Math.random().toString()).toString('hex'),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      // Log audit event
      await logAudit(user.id, 'LOGIN', 'User', user.id, undefined, req.ip);

      sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token: session.token,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Project Routes
// ============================================================================

/**
 * POST /projects
 * Create a new project
 */
router.post(
  '/projects',
  middleware.requireAuth,
  middleware.validate(ValidationSchemas.createProject),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { name, description, visibility } = req.body;

      // Generate slug
      const slug = name.toLowerCase().replace(/\s+/g, '-');

      const project = await prisma.project.create({
        data: {
          userId: req.user!.id,
          name,
          description,
          slug,
          visibility: visibility || 'PRIVATE',
        },
      });

      // Log audit
      await logAudit(req.user!.id, 'CREATE', 'Project', project.id, { name }, req.ip);

      sendSuccess(res, project, 201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /projects
 * List user projects with pagination
 */
router.get(
  '/projects',
  middleware.requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.min(50, parseInt(req.query.pageSize as string) || 20);
      const offset = (page - 1) * pageSize;

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where: { userId: req.user!.id },
          skip: offset,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { files: true, tasks: true } },
          },
        }),
        prisma.project.count({ where: { userId: req.user!.id } }),
      ]);

      sendPaginated(res, projects, total, page, pageSize);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /projects/:id
 * Get project details
 */
router.get(
  '/projects/:id',
  middleware.requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          files: { select: { id: true, path: true, language: true } },
          tasks: { select: { id: true, title: true, status: true } },
          _count: { select: { files: true, tasks: true } },
        },
      });

      if (!project) {
        throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
      }

      // Check RLS
      if (project.userId !== req.user!.id) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      }

      sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /projects/:id
 * Update project
 */
router.patch(
  '/projects/:id',
  middleware.requireAuth,
  middleware.validate(ValidationSchemas.updateProject),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;
      const { name, description, visibility } = req.body;

      // Verify ownership
      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.userId !== req.user!.id) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      }

      const updated = await prisma.project.update({
        where: { id },
        data: { name, description, visibility },
      });

      // Log audit
      await logAudit(
        req.user!.id,
        'UPDATE',
        'Project',
        id,
        { name, description, visibility },
        req.ip
      );

      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /projects/:id
 * Delete project
 */
router.delete(
  '/projects/:id',
  middleware.requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;

      // Verify ownership
      const project = await prisma.project.findUnique({ where: { id } });
      if (!project || project.userId !== req.user!.id) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      }

      await prisma.project.delete({ where: { id } });

      // Log audit
      await logAudit(req.user!.id, 'DELETE', 'Project', id, undefined, req.ip);

      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// File Routes
// ============================================================================

/**
 * GET /projects/:projectId/files
 * List project files
 */
router.get(
  '/projects/:projectId/files',
  middleware.requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { projectId } = req.params;

      // Verify access
      if (!(await hasProjectAccess(req.user!.id, projectId))) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      }

      const files = await prisma.file.findMany({
        where: { projectId },
        select: {
          id: true,
          path: true,
          language: true,
          size: true,
          hash: true,
          updatedAt: true,
        },
        orderBy: { path: 'asc' },
      });

      sendSuccess(res, files);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /projects/:projectId/files
 * Create/update file
 */
router.post(
  '/projects/:projectId/files',
  middleware.requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { projectId } = req.params;
      const { path, content, language } = req.body;

      // Verify write access
      if (!(await hasProjectAccess(req.user!.id, projectId, 'EDITOR'))) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      }

      // Calculate hash
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256').update(content).digest('hex');

      const file = await prisma.file.upsert({
        where: { projectId_path: { projectId, path } },
        create: {
          projectId,
          path,
          content,
          language,
          size: content.length,
          hash,
        },
        update: {
          content,
          size: content.length,
          hash,
        },
      });

      // Log audit
      await logAudit(req.user!.id, 'CREATE_FILE', 'File', file.id, { path }, req.ip);

      sendSuccess(res, file, 201);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Task Routes
// ============================================================================

/**
 * POST /projects/:projectId/tasks
 * Create task
 */
router.post(
  '/projects/:projectId/tasks',
  middleware.requireAuth,
  middleware.validate(ValidationSchemas.createTask),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { projectId } = req.params;
      const { title, description, type, priority } = req.body;

      // Verify access
      if (!(await hasProjectAccess(req.user!.id, projectId, 'EDITOR'))) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied');
      }

      const task = await prisma.task.create({
        data: {
          projectId,
          title,
          description,
          type,
          priority: priority || 'MEDIUM',
        },
      });

      // Log audit
      await logAudit(req.user!.id, 'CREATE', 'Task', task.id, { title, type }, req.ip);

      sendSuccess(res, task, 201);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Webhook Routes (for integrations)
// ============================================================================

/**
 * POST /webhooks/:webhookId/verify
 * Verify webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return hash === signature;
}

/**
 * POST /webhooks/:webhookId
 * Receive webhook event
 */
router.post('/webhooks/:webhookId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { webhookId } = req.params;
    const signature = req.headers['x-webhook-signature'] as string;

    const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook) {
      throw new AppError(404, 'WEBHOOK_NOT_FOUND', 'Webhook not found');
    }

    // Verify signature
    const payload = JSON.stringify(req.body);
    if (!verifyWebhookSignature(payload, signature, webhook.secret)) {
      throw new AppError(401, 'INVALID_SIGNATURE', 'Invalid webhook signature');
    }

    // Create delivery record
    await prisma.webhookDelivery.create({
      data: {
        webhookId,
        eventType: req.body.event,
        payload: req.body,
      },
    });

    sendSuccess(res, { received: true });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Error Handler
// ============================================================================

router.use(middleware.errorHandler);

export default router;
