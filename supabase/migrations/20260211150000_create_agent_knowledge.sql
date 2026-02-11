-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge documents table for RAG (Retrieval Augmented Generation)
CREATE TABLE agent_knowledge_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,

    -- Document content
    content TEXT NOT NULL,
    chunk_index INTEGER DEFAULT 0, -- For splitting large documents

    -- Vector embedding (OpenAI ada-002: 1536 dimensions)
    embedding VECTOR(1536),

    -- Metadata for filtering and tracking
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps for auditing
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance optimization
CREATE INDEX idx_agent_knowledge_agent_id
    ON agent_knowledge_docs(agent_id);

CREATE INDEX idx_agent_knowledge_embedding
    ON agent_knowledge_docs
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Enable Row Level Security
ALTER TABLE agent_knowledge_docs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view documents from their agents
CREATE POLICY "Users can view their agent docs"
    ON agent_knowledge_docs FOR SELECT
    USING (agent_id IN (
        SELECT id FROM ai_agents WHERE user_id = auth.uid()
    ));

-- RLS Policy: Users can insert documents for their agents
CREATE POLICY "Users can insert their agent docs"
    ON agent_knowledge_docs FOR INSERT
    WITH CHECK (agent_id IN (
        SELECT id FROM ai_agents WHERE user_id = auth.uid()
    ));

-- RLS Policy: Users can delete documents from their agents
CREATE POLICY "Users can delete their agent docs"
    ON agent_knowledge_docs FOR DELETE
    USING (agent_id IN (
        SELECT id FROM ai_agents WHERE user_id = auth.uid()
    ));

-- SQL Function for semantic search using pgvector
CREATE OR REPLACE FUNCTION match_agent_documents(
    query_embedding VECTOR(1536),
    p_agent_id UUID,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
    SELECT
        akd.id,
        akd.content,
        akd.metadata,
        1 - (akd.embedding <=> query_embedding) AS similarity
    FROM agent_knowledge_docs akd
    WHERE akd.agent_id = p_agent_id
        AND 1 - (akd.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
$$;

-- Comment for documentation
COMMENT ON TABLE agent_knowledge_docs IS 'Stores vectorized documents for RAG (Retrieval Augmented Generation) to augment AI agent prompts with relevant knowledge';
COMMENT ON FUNCTION match_agent_documents IS 'Performs semantic search on agent knowledge documents using vector similarity (cosine distance)';
