export const APP_NAME = 'Agentic AI Learning Platform';
export const APP_VERSION = '1.0.0';
export const API_PREFIX = '/api/v1';
export const WS_PREFIX = '/ws';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const JWT_ACCESS_TOKEN_EXPIRY = '15m';
export const JWT_REFRESH_TOKEN_EXPIRY = '7d';

export const AI_MODEL_DEFAULTS = {
  openai: 'gpt-4-turbo-preview',
  anthropic: 'claude-3-opus-20240229',
  embedding: 'text-embedding-ada-002',
} as const;

export const VECTOR_DIMENSIONS = {
  'text-embedding-ada-002': 1536,
  'text-embedding-3-small': 512,
  'text-embedding-3-large': 3072,
} as const;

export const CHUNK_DEFAULTS = {
  size: 1000,
  overlap: 200,
} as const;

export const CACHE_TTL = {
  short: 60,
  medium: 300,
  long: 3600,
  day: 86400,
} as const;

export const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, max: 100 },
  api: { windowMs: 60 * 1000, max: 1000 },
  ai: { windowMs: 60 * 1000, max: 50 },
} as const;

export const FILE_UPLOAD = {
  maxSize: 10 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain', 'text/markdown'],
} as const;

export const WEBSOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE: 'message',
  ERROR: 'error',
  TYPING: 'typing',
  AGENT_RESPONSE: 'agent_response',
  CODE_EXECUTION: 'code_execution',
  COLLABORATION: 'collaboration',
} as const;