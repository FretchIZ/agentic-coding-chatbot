-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS learning;
CREATE SCHEMA IF NOT EXISTS ai;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Vector dimensions for OpenAI text-embedding-3-small (1536)
CREATE TABLE IF NOT EXISTS ai.embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON ai.embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_embeddings_metadata ON ai.embeddings USING gin (metadata);