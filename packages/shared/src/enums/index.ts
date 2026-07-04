export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DEPRECATED = 'deprecated',
}

export enum LessonType {
  MARKDOWN = 'markdown',
  VIDEO = 'video',
  INTERACTIVE = 'interactive',
  QUIZ = 'quiz',
  PRACTICE = 'practice',
  PROJECT = 'project',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  CODE = 'code',
  FILL_IN_BLANK = 'fill_in_blank',
  MATCHING = 'matching',
  ORDERING = 'ordering',
}

export enum SubmissionStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  RETURNED = 'returned',
  LATE = 'late',
}

export enum AIModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  VERCEL = 'vercel',
  LOCAL = 'local',
}

export enum AgentType {
  TUTOR = 'tutor',
  CODING = 'coding',
  REVIEWER = 'reviewer',
  PLANNER = 'planner',
  QUIZ = 'quiz',
  DEBUGGER = 'debugger',
  RESEARCH = 'research',
  MEMORY = 'memory',
  ORCHESTRATOR = 'orchestrator',
}

export enum SessionType {
  CHAT = 'chat',
  CODING = 'coding',
  REVIEW = 'review',
  QUIZ = 'quiz',
  DEBUG = 'debug',
  RESEARCH = 'research',
}

export enum MemoryType {
  SHORT_TERM = 'short_term',
  LONG_TERM = 'long_term',
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
  PROCEDURAL = 'procedural',
}

export enum VectorDatabase {
  PGVECTOR = 'pgvector',
  QDRANT = 'qdrant',
  PINECONE = 'pinecone',
  WEAVIATE = 'weaviate',
  CHROMA = 'chroma',
}

export enum ChunkingStrategy {
  SENTENCE = 'sentence',
  PARAGRAPH = 'paragraph',
  MARKDOWN = 'markdown',
  CODE = 'code',
  OVERLAPPING = 'overlapping',
  HIERARCHICAL = 'hierarchical',
}

export enum RetrievalMethod {
  SEMANTIC = 'semantic',
  KEYWORD = 'keyword',
  HYBRID = 'hybrid',
}

export enum RerankingMethod {
  COSINE = 'cosine',
  L2 = 'l2',
  DOT_PRODUCT = 'dot_product',
  CROSS_ENCODER = 'cross_encoder',
}

export enum AnalyticsEventType {
  PAGE_VIEW = 'page_view',
  LESSON_START = 'lesson_start',
  LESSON_COMPLETE = 'lesson_complete',
  QUIZ_ATTEMPT = 'quiz_attempt',
  CODE_EXECUTION = 'code_execution',
  AI_INTERACTION = 'ai_interaction',
  ERROR = 'error',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  ACHIEVEMENT = 'achievement',
  REMINDER = 'reminder',
}

export enum CacheStrategy {
  WRITE_THROUGH = 'write_through',
  WRITE_BACK = 'write_back',
  WRITE_AROUND = 'write_around',
  REFRESH_AHEAD = 'refresh_ahead',
}