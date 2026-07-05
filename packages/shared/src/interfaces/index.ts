import type { UserRole, DifficultyLevel, CourseStatus, LessonType, QuestionType, AgentType, SessionType, MemoryType, VectorDatabase, ChunkingStrategy, RetrievalMethod, RerankingMethod, NotificationType } from '../enums';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  preferences: UserPreferences;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
  aiSettings: AISettings;
  editorSettings: EditorSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  weeklyDigest: boolean;
  achievementAlerts: boolean;
}

export interface AISettings {
  preferredModel: string;
  autoSuggest: boolean;
  codeCompletion: boolean;
  explanationDepth: 'concise' | 'detailed' | 'comprehensive';
}

export interface EditorSettings {
  theme: string;
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
}

export interface Course extends BaseEntity {
  title: string;
  description: string;
  thumbnailUrl?: string;
  category: string;
  difficulty: DifficultyLevel;
  estimatedHours: number;
  status: CourseStatus;
  instructorId: string;
  prerequisites: string[];
  tags: string[];
  learningObjectives: string[];
  enrollmentCount: number;
  rating: number;
}

export interface Lesson extends BaseEntity {
  title: string;
  content: string;
  order: number;
  courseId: string;
  type: LessonType;
  durationMinutes: number;
  isPublished: boolean;
  metadata: LessonMetadata;
}

export interface LessonMetadata {
  codeBlocks?: CodeBlock[];
  interactiveElements?: InteractiveElement[];
  resources?: Resource[];
  quizId?: string;
  practiceProblemId?: string;
}

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  filename?: string;
  isRunnable: boolean;
  testCases?: TestCase[];
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
}

export interface InteractiveElement {
  id: string;
  type: 'demo' | 'simulation' | 'visualization';
  config: Record<string, unknown>;
}

export interface Resource {
  id: string;
  title: string;
  type: 'link' | 'file' | 'video' | 'document';
  url: string;
  description?: string;
}

export interface Quiz extends BaseEntity {
  title: string;
  description: string;
  lessonId?: string;
  courseId?: string;
  questions: Question[];
  timeLimitMinutes?: number;
  passingScore: number;
  maxAttempts: number;
  isPublished: boolean;
}

export interface Question extends BaseEntity {
  quizId: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  difficulty: DifficultyLevel;
  tags: string[];
  metadata?: QuestionMetadata;
}

export interface QuestionMetadata {
  codeTemplate?: string;
  language?: string;
  testCases?: TestCase[];
  hints?: string[];
}

export interface PracticeProblem extends BaseEntity {
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  category: string;
  starterCode?: string;
  solutionCode?: string;
  testCases: TestCase[];
  hints: string[];
  tags: string[];
}

export interface Progress extends BaseEntity {
  userId: string;
  lessonId?: string;
  courseId?: string;
  completionPercentage: number;
  timeSpentMinutes: number;
  lastAccessedAt: Date;
  metadata: ProgressMetadata;
}

export interface ProgressMetadata {
  quizScores?: QuizScore[];
  codeSubmissions?: CodeSubmission[];
  aiInteractions?: AIInteraction[];
}

export interface QuizScore {
  quizId: string;
  score: number;
  maxScore: number;
  attemptedAt: Date;
  answers: Record<string, string>;
}

export interface CodeSubmission {
  problemId: string;
  code: string;
  language: string;
  status: 'passed' | 'failed' | 'error';
  output?: string;
  executionTimeMs: number;
  submittedAt: Date;
}

export interface AIInteraction {
  agentType: AgentType;
  sessionId: string;
  prompt: string;
  response: string;
  tokensUsed: number;
  timestamp: Date;
}

export interface Session extends BaseEntity {
  userId: string;
  type: SessionType;
  title?: string;
  context: Record<string, unknown>;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: Date;
  endedAt?: Date;
  messageCount: number;
}

export interface Memory extends BaseEntity {
  sessionId: string;
  type: MemoryType;
  content: string;
  embedding?: number[];
  metadata: MemoryMetadata;
  importance: number;
  accessCount: number;
  lastAccessedAt: Date;
}

export interface MemoryMetadata {
  source: 'user' | 'assistant' | 'system' | 'external';
  tags: string[];
  relatedEntities?: string[];
  confidence: number;
}

export interface Embedding extends BaseEntity {
  documentId: string;
  model: string;
  dimensions: number;
  chunks: EmbeddingChunk[];
}

export interface EmbeddingChunk {
  index: number;
  content: string;
  embedding: number[];
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  source: string;
  section?: string;
  pageNumber?: number;
  tags: string[];
}

export interface Document extends BaseEntity {
  contentType: 'lesson' | 'article' | 'code' | 'documentation' | 'faq';
  source: string;
  title: string;
  content: string;
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  author?: string;
  category?: string;
  tags: string[];
  language?: string;
  version?: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: ResponseMeta;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  version: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: string;
  requestId?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}