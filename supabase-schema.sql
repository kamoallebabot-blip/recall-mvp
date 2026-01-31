-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Agents table
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  api_key TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_api_key ON agents(api_key);

-- Memories table
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memories_agent_id ON memories(agent_id);
CREATE INDEX idx_memories_created_at ON memories(created_at DESC);
CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Semantic search function
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  target_agent_id text
)
RETURNS TABLE (
  id text,
  agent_id text,
  content text,
  metadata jsonb,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    memories.id,
    memories.agent_id,
    memories.content,
    memories.metadata,
    1 - (memories.embedding <=> query_embedding) as similarity,
    memories.created_at
  FROM memories
  WHERE 
    memories.agent_id = target_agent_id
    AND 1 - (memories.embedding <=> query_embedding) > match_threshold
  ORDER BY memories.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
