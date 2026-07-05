import type { AIModelProvider, UserRole, CourseStatus, LessonType, DifficultyLevel, QuestionType, SubmissionStatus, AgentType, SessionType, MemoryType, VectorDatabase, ChunkingStrategy, RetrievalMethod, RerankingMethod, AnalyticsEventType, NotificationType, CacheStrategy } from '../enums';

export type { AIModelProvider, UserRole, CourseStatus, LessonType, DifficultyLevel, QuestionType, SubmissionStatus, AgentType, SessionType, MemoryType, VectorDatabase, ChunkingStrategy, RetrievalMethod, RerankingMethod, AnalyticsEventType, NotificationType, CacheStrategy };

export type UUID = string & { readonly brand: unique symbol };
export type ISODateString = string & { readonly brand: unique symbol };
export type Email = string & { readonly brand: unique symbol };
export type URL = string & { readonly brand: unique symbol };

export type PaginatedResponse<T> = {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AsyncResult<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type EntityMap<T extends { id: string }> = Record<string, T>;

export type SortDirection = 'asc' | 'desc';
export type SortConfig<T> = { field: keyof T; direction: SortDirection };

export type FilterOperator = 
  | 'eq' 
  | 'neq' 
  | 'gt' 
  | 'gte' 
  | 'lt' 
  | 'lte' 
  | 'in' 
  | 'nin' 
  | 'contains' 
  | 'startsWith' 
  | 'endsWith' 
  | 'isNull' 
  | 'isNotNull';

export type FilterCondition<T> = {
  field: keyof T;
  operator: FilterOperator;
  value: unknown;
};

export type QueryOptions<T> = {
  filters?: FilterCondition<T>[];
  sort?: SortConfig<T>[];
  pagination?: { page: number; limit: number };
  include?: string[];
};

export type MutationResult<T> = {
  id: string;
  data: T;
  timestamp: Date;
};

export type EventPayload<T extends string, D> = {
  type: T;
  data: D;
  timestamp: Date;
  correlationId?: string;
};

export type HealthCheckResult = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, { status: string; latency?: number; error?: string }>;
  timestamp: Date;
};

export type FeatureFlags = {
  enableAIAgents: boolean;
  enableVectorSearch: boolean;
  enableRAG: boolean;
  enableAnalytics: boolean;
  enableRealTimeCollaboration: boolean;
  enableCodeExecution: boolean;
  enableVideoLessons: boolean;
};

export type SupportedLanguage = 
  | 'python' 
  | 'javascript' 
  | 'typescript' 
  | 'java' 
  | 'cpp' 
  | 'c' 
  | 'csharp' 
  | 'go' 
  | 'rust' 
  | 'ruby' 
  | 'php' 
  | 'swift' 
  | 'kotlin' 
  | 'scala' 
  | 'r' 
  | 'sql' 
  | 'html' 
  | 'css' 
  | 'markdown' 
  | 'json' 
  | 'yaml';

export type CodeExecutionResult = {
  success: boolean;
  output: string;
  error?: string;
  executionTimeMs: number;
  memoryUsedMb: number;
  exitCode: number;
};

export type AIMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
};

export type ToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

export type ToolDefinition = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type EmbeddingInput = string | string[];
export type EmbeddingOutput = number[];

export type VectorSearchResult = {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
  content?: string;
};

export type RAGContext = {
  query: string;
  chunks: VectorSearchResult[];
  tokensUsed: number;
  model: string;
};

export interface ModelConfig {
  provider: AIModelProvider;
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stop?: string[];
}

export interface ModelResponse {
  content: string;
  toolCalls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  latencyMs: number;
}