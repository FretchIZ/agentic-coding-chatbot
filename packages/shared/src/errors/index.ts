export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    code: string,
    message: string,
    statusCode = 500,
    details?: Record<string, unknown>,
    isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super('NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super('AUTHENTICATION_ERROR', message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super('AUTHORIZATION_ERROR', message, 403);
    this.name = 'AuthorizationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super('RATE_LIMIT', message, 429);
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super('INTERNAL_ERROR', message, 500, {}, false);
    this.name = 'InternalServerError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super('SERVICE_UNAVAILABLE', `${service} is currently unavailable`, 503);
    this.name = 'ServiceUnavailableError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(
      'EXTERNAL_SERVICE_ERROR',
      `Error calling external service: ${service}`,
      502,
      { originalError: originalError?.message },
      false
    );
    this.name = 'ExternalServiceError';
  }
}

export class AIError extends AppError {
  constructor(message: string, provider: string, details?: Record<string, unknown>) {
    super('AI_ERROR', `AI provider '${provider}' error: ${message}`, 503, details);
    this.name = 'AIError';
  }
}

export class VectorDatabaseError extends AppError {
  constructor(message: string, database: string) {
    super('VECTOR_DB_ERROR', `Vector DB '${database}' error: ${message}`, 503);
    this.name = 'VectorDatabaseError';
  }
}

export type ApplicationError =
  | AppError
  | ValidationError
  | NotFoundError
  | AuthenticationError
  | AuthorizationError
  | ConflictError
  | RateLimitError
  | InternalServerError
  | ServiceUnavailableError
  | ExternalServiceError
  | AIError
  | VectorDatabaseError;