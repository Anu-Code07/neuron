-- Neuron Context Engine — Initial Schema
-- Phase 1: Core tables, knowledge graph, embeddings, RLS

-- Extensions
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE context_layer AS ENUM (
  'user', 'organization', 'project', 'branch', 'task', 'conversation'
);

CREATE TYPE memory_type AS ENUM (
  'architecture', 'coding_standard', 'tech_stack', 'component', 'api',
  'database', 'business_rule', 'fact', 'decision', 'pattern', 'task',
  'feature', 'bug', 'conversation', 'relationship', 'entity',
  'dependency', 'roadmap', 'note', 'file'
);

CREATE TYPE memory_status AS ENUM (
  'active', 'superseded', 'merged', 'forgotten', 'expired'
);

CREATE TYPE relationship_type AS ENUM (
  'uses', 'references', 'depends_on', 'implements', 'supersedes',
  'related_to', 'calls', 'contains', 'blocks', 'fixes'
);

CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE project_role AS ENUM ('owner', 'editor', 'viewer');

-- ============================================================
-- USERS (extends auth.users)
-- ============================================================

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  display_name TEXT,
  avatar_url  TEXT,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

CREATE TABLE public.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  owner_id    UUID NOT NULL REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            org_role NOT NULL DEFAULT 'member',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE public.projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT,
  tech_stack      TEXT[] NOT NULL DEFAULT '{}',
  settings        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE TABLE public.project_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        project_role NOT NULL DEFAULT 'editor',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE TABLE public.repositories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  url             TEXT,
  default_branch  TEXT NOT NULL DEFAULT 'main',
  provider        TEXT NOT NULL DEFAULT 'github',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- KNOWLEDGE GRAPH — MEMORIES
-- ============================================================

CREATE TABLE public.memories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type            memory_type NOT NULL,
  layer           context_layer NOT NULL DEFAULT 'project',
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  summary         TEXT,
  status          memory_status NOT NULL DEFAULT 'active',
  confidence      REAL NOT NULL DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  importance      REAL NOT NULL DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  access_count    INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  source_type     TEXT NOT NULL DEFAULT 'manual',
  source_ref_id   TEXT,
  source_actor_id UUID REFERENCES public.profiles(id),
  metadata        JSONB NOT NULL DEFAULT '{}',
  tags            TEXT[] NOT NULL DEFAULT '{}',
  search_vector   TSVECTOR,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.relationships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source_memory_id  UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  target_memory_id  UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  type              relationship_type NOT NULL,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_memory_id, target_memory_id, type)
);

-- ============================================================
-- EMBEDDINGS (pgvector)
-- ============================================================

CREATE TABLE public.embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id   UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  embedding   vector(1536) NOT NULL,
  model       TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (memory_id, model)
);

-- ============================================================
-- CONTEXT SNAPSHOTS (pre-computed packets)
-- ============================================================

CREATE TABLE public.context_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  branch_name     TEXT,
  task_id         UUID REFERENCES public.memories(id) ON DELETE SET NULL,
  packet          JSONB NOT NULL,
  token_estimate  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CONVERSATIONS (ephemeral — extracted, not primary storage)
-- ============================================================

CREATE TABLE public.conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title       TEXT,
  messages    JSONB NOT NULL DEFAULT '[]',
  extracted   BOOLEAN NOT NULL DEFAULT false,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SUMMARIES
-- ============================================================

CREATE TABLE public.summaries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scope       TEXT NOT NULL,
  scope_id    UUID,
  content     TEXT NOT NULL,
  token_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- API KEYS (MCP authentication)
-- ============================================================

CREATE TABLE public.api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  key_hash    TEXT NOT NULL,
  key_prefix  TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_by  UUID NOT NULL REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.profiles(id),
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS & COMMENTS
-- ============================================================

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  read        BOOLEAN NOT NULL DEFAULT false,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  memory_id   UUID REFERENCES public.memories(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_memories_project_id ON public.memories(project_id);
CREATE INDEX idx_memories_type ON public.memories(type);
CREATE INDEX idx_memories_status ON public.memories(status);
CREATE INDEX idx_memories_layer ON public.memories(layer);
CREATE INDEX idx_memories_confidence ON public.memories(confidence DESC);
CREATE INDEX idx_memories_importance ON public.memories(importance DESC);
CREATE INDEX idx_memories_expires_at ON public.memories(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_memories_tags ON public.memories USING GIN(tags);
CREATE INDEX idx_memories_metadata ON public.memories USING GIN(metadata);
CREATE INDEX idx_memories_search ON public.memories USING GIN(search_vector);
CREATE INDEX idx_memories_title_trgm ON public.memories USING GIN(title gin_trgm_ops);
CREATE INDEX idx_memories_content_trgm ON public.memories USING GIN(content gin_trgm_ops);

CREATE INDEX idx_relationships_project ON public.relationships(project_id);
CREATE INDEX idx_relationships_source ON public.relationships(source_memory_id);
CREATE INDEX idx_relationships_target ON public.relationships(target_memory_id);

CREATE INDEX idx_embeddings_project ON public.embeddings(project_id);
CREATE INDEX idx_embeddings_memory ON public.embeddings(memory_id);

CREATE INDEX idx_context_snapshots_project ON public.context_snapshots(project_id);

CREATE INDEX idx_audit_logs_project ON public.audit_logs(project_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);

-- Vector similarity search index (IVFFlat — build after data exists)
-- CREATE INDEX idx_embeddings_vector ON public.embeddings
--   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- TRIGGERS — updated_at + search_vector
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_memory_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := (
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'C')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_memories_updated_at BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_memories_search_vector BEFORE INSERT OR UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.update_memory_search_vector();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Increment access count
CREATE OR REPLACE FUNCTION public.increment_memory_access(p_memory_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.memories
  SET access_count = access_count + 1,
      last_accessed_at = now()
  WHERE id = p_memory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expire ephemeral memories
CREATE OR REPLACE FUNCTION public.expire_stale_memories()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.memories
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
