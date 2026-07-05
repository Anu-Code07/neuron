-- AI vector search: 384-dim embeddings (HuggingFace all-MiniLM-L6-v2)
-- Groq handles LLM; embeddings stored for semantic retrieval

ALTER TABLE public.embeddings
  ALTER COLUMN embedding TYPE vector(384),
  ALTER COLUMN model SET DEFAULT 'sentence-transformers/all-MiniLM-L6-v2';

CREATE INDEX IF NOT EXISTS idx_embeddings_hnsw
  ON public.embeddings
  USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION public.match_embeddings(
  query_embedding vector(384),
  p_project_id uuid,
  match_count int DEFAULT 20,
  match_threshold float DEFAULT 0.25
)
RETURNS TABLE (
  memory_id uuid,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.memory_id,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.embeddings e
  WHERE e.project_id = p_project_id
    AND 1 - (e.embedding <=> query_embedding) >= match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_embeddings(vector(384), uuid, int, float) TO service_role;
