import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { getPrisma } from '@codeagent/database';
import { createClient } from 'redis';

// ============================================================================
// Type Definitions & Constants
// ============================================================================

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    apiKeyId?: string;
  };
  clientId?: string; // For rate limiting
  id?: string; // Request ID
}

export interface ApiError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, any>;
}

const RATE_LIMIT_TIERS = {
  FREE: { requests: 100, window: 3600 },      // 100/hour
  PRO: { requests: 1000, window: 3600 },      // 1000/hour
  ENTERPRISE: { requests: 10000, window: 3600 }, // 10k/hour
} as const;

// ============================================================================
// Error Handling
// ============================================================================

export class AppError extends Error implements ApiError {
  statusCode: number;
  code: string;
  details?: Record<string, any>;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ============================================================================
// Logging & Monitoring
// ============================================================================

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatLog(level: string, message: string, data?: any) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...(data && { data }),
    });
  }

  debug(message: string, data?: any) {
    console.log(this.formatLog('DEBUG', message, data));
  }

  info(message: string, data?: any) {
    console.log(this.formatLog('INFO', message, data));
  }

  warn(message: string, data?: any) {
    console.warn(this.formatLog('WARN', message, data));
  }

  error(message: string, error?: Error | any) {
    console.error(this.formatLog('ERROR', message, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    }));
  }

  fatal(message: string, error?: Error | any) {
    console.error(this.formatLog('FATAL', message, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    }));
  }
}

// ============================================================================
// Rate Limiting
// ============================================================================

export class RateLimiter {
  private redis: ReturnType<typeof createClient>;
  private logger = new Logger('RateLimiter');

  constructor(redis: ReturnType<typeof createClient>) {
    this.redis = redis;
  }

  async checkLimit(userId: string, tier: string = 'FREE'): Promise<boolean> {
    const tierConfig = RATE_LIMIT_TIERS[tier as keyof typeof RATE_LIMIT_TIERS] || RATE_LIMIT_TIERS.FREE;
    const key = `ratelimit:${userId}`;

    try {
      const current = await this.redis.incr(key);
      
      if (current === 1) {
        await this.redis.expire(key, tierConfig.window);
      }

      if (current > tierConfig.requests) {
        this.logger.warn('Rate limit exceeded', { userId, current, limit: tierConfig.requests });
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Rate limit check failed', error);
      // Fail open - allow request if Redis is down
      return true;
    }
  }

  async getRemainingRequests(userId: string, tier: string = 'FREE'): Promise<number> {
    const tierConfig = RATE_LIMIT_TIERS[tier as keyof typeof RATE_LIMIT_TIERS] || RATE_LIMIT_TIERS.FREE;
    const key = `ratelimit:${userId}`;

    try {
      const current = await this.redis.get(key);
      return Math.max(0, tierConfig.requests - (parseInt(current || '0')));
    } catch {
      return tierConfig.requests;
    }
  }
}

// ============================================================================
// Authentication Middleware
// ============================================================================

export class AuthService {
  private logger = new Logger('AuthService');

  async verifyJWT(token: string): Promise<{ userId: string; email: string; role: string }> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return {
        userId: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token');
    }
  }

  async verifyApiKey(keyHash: string): Promise<{ userId: string; apiKeyId: string }> {
    const prisma = getPrisma();
    
    try {
      const apiKey = await (prisma as any).apiKey.findUnique({
        where: { keyHash },
        include: { user: true },
      });

      if (!apiKey || !apiKey.user) {
        throw new AppError(401, 'INVALID_API_KEY', 'Invalid API key');
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        throw new AppError(401, 'EXPIRED_API_KEY', 'API key has expired');
      }

      // Update last used timestamp
      await (prisma as any).apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });

      return {
        userId: apiKey.userId,
        apiKeyId: apiKey.id,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(401, 'API_KEY_ERROR', 'Failed to verify API key');
    }
  }
}

// ============================================================================
// Validation Schema Factory
// ============================================================================

export const ValidationSchemas = {
  // Auth
  login: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),

  signup: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2).optional(),
  }),

  // Projects
  createProject: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    visibility: z.enum(['PRIVATE', 'INTERNAL', 'PUBLIC']).optional(),
  }),

  updateProject: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    visibility: z.enum(['PRIVATE', 'INTERNAL', 'PUBLIC']).optional(),
  }),

  // Tasks
  createTask: z.object({
    title: z.string().min(1).max(255),
    description: z.string().max(5000).optional(),
    type: z.enum(['CODE', 'REVIEW', 'TEST', 'SEARCH', 'PLAN', 'RESEARCH']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  }),
};

// ============================================================================
// Middleware Factory
// ============================================================================

export function createMiddleware(
  redis: ReturnType<typeof createClient>,
  authService: AuthService,
  rateLimiter: RateLimiter
) {
  const logger = new Logger('Middleware');

  // Request logging middleware
  const requestLogger = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    logger.info('Request received', {
      method: (req as any).method,
      path: (req as any).path,
      ip: (req as any).ip,
      userId: req.user?.id,
    });
    next();
  };

  // Security headers
  const securityHeaders = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });

  // CORS configuration
  const corsMiddleware = cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    maxAge: 86400,
  });

  // Authentication middleware
  const authenticateRequest = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      const authHeader = (req as any).headers.authorization;
      const apiKeyHeader = (req as any).headers['x-api-key'];

      if (apiKeyHeader) {
        // API Key authentication
        const { userId, apiKeyId } = await authService.verifyApiKey(apiKeyHeader as string);
        req.user = {
          id: userId,
          email: '', // API keys don't have email
          role: 'USER',
          apiKeyId,
        };
        req.clientId = userId;
      } else if (authHeader?.startsWith('Bearer ')) {
        // JWT authentication
        const token = authHeader.slice(7);
        const { userId, email, role } = await authService.verifyJWT(token);
        req.user = { id: userId, email, role };
        req.clientId = userId;
      } else {
        // No auth required for public endpoints (checked at route level)
        req.clientId = (req as any).ip || 'unknown';
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }
      next(new AppError(401, 'AUTH_ERROR', 'Authentication failed'));
    }
  };

  // Rate limiting middleware
  const applyRateLimit = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.clientId) {
      return next();
    }

    try {
      const prisma = getPrisma();
      let tier = 'FREE';

      if (req.user?.id) {
        const rateLimit = await (prisma as any).rateLimit.findUnique({
          where: { userId: req.user.id },
        });
        tier = rateLimit?.tier || 'FREE';
      }

      const allowed = await rateLimiter.checkLimit(req.clientId, tier);
      if (!allowed) {
        return next(new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests'));
      }

      const remaining = await rateLimiter.getRemainingRequests(req.clientId, tier);
      res.setHeader('X-RateLimit-Remaining', remaining);

      next();
    } catch (error) {
      logger.error('Rate limit middleware error', error);
      next();
    }
  };

  // Validation middleware factory
  const validate = (schema: z.ZodSchema) => (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      const result = schema.parse((req as any).body);
      (req as any).body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(400, 'VALIDATION_ERROR', 'Validation failed', {
          errors: error.errors,
        }));
      } else {
        next(error);
      }
    }
  };

  // Require authentication middleware
  const requireAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    } else {
      next();
    }
  };

  // Error handling middleware
  const errorHandler = (
    error: any,
    _req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
  ) => {
    if (error instanceof AppError) {
      logger.warn('API Error', {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      });

      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && { details: error.details }),
        },
      });
    }

    logger.error('Unhandled error', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  };

  return {
    requestLogger,
    securityHeaders,
    corsMiddleware,
    authenticateRequest,
    applyRateLimit,
    validate,
    requireAuth,
    errorHandler,
  };
}

// ============================================================================
// Response Helpers
// ============================================================================

export function sendSuccess(res: Response, data: any, statusCode: number = 200) {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendPaginated(
  res: Response,
  data: any[],
  total: number,
  page: number,
  pageSize: number,
  statusCode: number = 200
) {
  res.status(statusCode).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
