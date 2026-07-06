-- Project-to-project links (host app ↔ package / workspace)
CREATE TYPE public.project_link_type AS ENUM (
  'depends_on',
  'contains',
  'consumes',
  'workspace'
);

CREATE TABLE public.project_links (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  target_project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  link_type         public.project_link_type NOT NULL DEFAULT 'depends_on',
  label             TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_project_id, target_project_id, link_type),
  CHECK (source_project_id <> target_project_id)
);

CREATE INDEX idx_project_links_source ON public.project_links (source_project_id);
CREATE INDEX idx_project_links_target ON public.project_links (target_project_id);

-- Map NEURON_REPO → registered repository under a project
ALTER TABLE public.repositories
  ADD COLUMN IF NOT EXISTS repo_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS repositories_project_repo_slug_unique
  ON public.repositories (project_id, repo_slug)
  WHERE repo_slug IS NOT NULL;

ALTER TABLE public.project_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view project links"
  ON public.project_links FOR SELECT
  USING (
    public.has_project_access(source_project_id)
    OR public.has_project_access(target_project_id)
  );

CREATE POLICY "Editors can manage outgoing project links"
  ON public.project_links FOR ALL
  USING (public.can_edit_project(source_project_id))
  WITH CHECK (public.can_edit_project(source_project_id));
