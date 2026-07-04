type EnvValue = string | number | boolean | undefined;

const getEnv = (key: string, defaultValue?: EnvValue): EnvValue => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
  return value;
};

const requireEnv = (key: string): string => {
  const value = getEnv(key);
  if (value === undefined) {
    throw new Error(`Required environment variable '${key}' is not set`);
  }
  return String(value);
};

export const config = {
  app: {
    name: String(getEnv('APP_NAME', 'Agentic AI Learning Platform')),
    version: String(getEnv('APP_VERSION', '1.0.0')),
    env: String(getEnv('NODE_ENV', 'development')),
    port: Number(getEnv('PORT', 3000)),
    apiPort: Number(getEnv('API_PORT', 4000)),
    aiAgentPort: Number(getEnv('AI_AGENT_PORT', 5000)),
    url: String(getEnv('APP_URL', 'http://localhost:3000')),
    apiUrl: String(getEnv('API_URL', 'http://localhost:4000')),
    isDev: getEnv('NODE_ENV') === 'development',
    isProd: getEnv('NODE_ENV') === 'production',
    isTest: getEnv('NODE_ENV') === 'test',
  },

  database: {
    url: String(getEnv('DATABASE_URL', 'postgresql://localhost:5432/learning-platform')),
    vectorUrl: String(getEnv('VECTOR_DATABASE_URL', 'postgresql://localhost:5432/vector-db')),
    redisUrl: String(getEnv('REDIS_URL', 'redis://localhost:6379')),
  },

  ai: {
    openai: {
      apiKey: requireEnv('OPENAI_API_KEY'),
      model: String(getEnv('OPENAI_MODEL', 'gpt-4-turbo-preview')),
      embeddingModel: String(getEnv('OPENAI_EMBEDDING_MODEL', 'text-embedding-ada-002')),
      maxTokens: Number(getEnv('OPENAI_MAX_TOKENS', 4096)),
      temperature: Number(getEnv('OPENAI_TEMPERATURE', 0.7)),
    },
    anthropic: {
      apiKey: String(getEnv('ANTHROPIC_API_KEY', '')),
      model: String(getEnv('ANTHROPIC_MODEL', 'claude-3-opus-20240229')),
      maxTokens: Number(getEnv('ANTHROPIC_MAX_TOKENS', 4096)),
      temperature: Number(getEnv('ANTHROPIC_TEMPERATURE', 0.7)),
    },
    local: {
      baseUrl: String(getEnv('LOCAL_AI_URL', 'http://localhost:11434')),
      model: String(getEnv('LOCAL_AI_MODEL', 'llama3')),
    },
  },

  auth: {
    jwtSecret: requireEnv('NEXTAUTH_SECRET'),
    jwtExpiry: String(getEnv('JWT_EXPIRY', '15m')),
    refreshTokenExpiry: String(getEnv('REFRESH_TOKEN_EXPIRY', '7d')),
    clerkSecretKey: String(getEnv('CLERK_SECRET_KEY', '')),
    clerkPublishableKey: String(getEnv('CLERK_PUBLISHABLE_KEY', '')),
  },

  storage: {
    endpoint: String(getEnv('S3_ENDPOINT', '')),
    accessKey: String(getEnv('S3_ACCESS_KEY', '')),
    secretKey: String(getEnv('S3_SECRET_KEY', '')),
    bucket: String(getEnv('S3_BUCKET', 'learning-platform')),
  },

  features: {
    enableAIAgents: Boolean(getEnv('ENABLE_AI_AGENTS', true)),
    enableVectorSearch: Boolean(getEnv('ENABLE_VECTOR_SEARCH', true)),
    enableRAG: Boolean(getEnv('ENABLE_RAG', true)),
    enableAnalytics: Boolean(getEnv('ENABLE_ANALYTICS', true)),
  },

  rateLimit: {
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 100,
    },
    api: {
      windowMs: 60 * 1000,
      max: 1000,
    },
    ai: {
      windowMs: 60 * 1000,
      max: 50,
    },
  },

  chunking: {
    defaultSize: Number(getEnv('CHUNK_SIZE', 1000)),
    defaultOverlap: Number(getEnv('CHUNK_OVERLAP', 200)),
  },

  cache: {
    short: 60,
    medium: 300,
    long: 3600,
    day: 86400,
  },
};

export { getEnv, requireEnv };