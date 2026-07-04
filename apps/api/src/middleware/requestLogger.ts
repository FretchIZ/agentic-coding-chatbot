import { Request, Response, NextFunction } from 'express';
import { logger } from '@learning-platform/shared';

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  const start = Date.now();
  const originalEnd = _res.end;
  _res.end = function(...args: any[]) {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${_res.statusCode} ${duration}ms`);
    return originalEnd.apply(this, args);
  };
  next();
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);
}