import { Request, Response, NextFunction } from 'express';
import { logger } from '@learning-platform/shared';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  logger.error(`Error ${statusCode}: ${err.message}`, err, { metadata: { code } });
  res.status(statusCode).json({
    error: { code, message: err.message || 'An unexpected error occurred' },
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function createError(message: string, statusCode: number, code?: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code || statusCode.toString();
  return error;
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';
  constructor(resource: string) { super(`${resource} not found`); }
}

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  constructor(message: string) { super(message); }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  code = 'UNAUTHORIZED';
  constructor(message: string = 'Unauthorized') { super(message); }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  code = 'FORBIDDEN';
  constructor(message: string = 'Forbidden') { super(message); }
}