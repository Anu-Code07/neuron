-- Row Level Security Policies
-- Hierarchy: org owner/admin → project member → memory access

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.context_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_project_access(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = p_project_id AND om.user_id = auth.uid()
  ) OR public.is_project_member(p_project_id);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_edit_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
  ) OR EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = p_project_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

CREATE POLICY "Org members can view their organizations"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(id));

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Org owners can update organizations"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid());

-- ============================================================
-- ORGANIZATION MEMBERS
-- ============================================================

CREATE POLICY "Org members can view members"
  ON public.organization_members FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Org admins can manage members"
  ON public.organization_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE POLICY "Project access for org/project members"
  ON public.projects FOR SELECT
  USING (public.has_project_access(id));

CREATE POLICY "Org members can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Project editors can update projects"
  ON public.projects FOR UPDATE
  USING (public.can_edit_project(id));

-- ============================================================
-- PROJECT MEMBERS
-- ============================================================

CREATE POLICY "Project members can view membership"
  ON public.project_members FOR SELECT
  USING (public.has_project_access(project_id));

CREATE POLICY "Project owners can manage members"
  ON public.project_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'owner'
    )
  );

-- ============================================================
-- MEMORIES (core knowledge graph)
-- ============================================================

CREATE POLICY "Project members can view memories"
  ON public.memories FOR SELECT
  USING (public.has_project_access(project_id));

CREATE POLICY "Project editors can create memories"
  ON public.memories FOR INSERT
  WITH CHECK (public.can_edit_project(project_id));

CREATE POLICY "Project editors can update memories"
  ON public.memories FOR UPDATE
  USING (public.can_edit_project(project_id));

CREATE POLICY "Project editors can delete memories"
  ON public.memories FOR DELETE
  USING (public.can_edit_project(project_id));

-- ============================================================
-- RELATIONSHIPS
-- ============================================================

CREATE POLICY "Project members can view relationships"
  ON public.relationships FOR SELECT
  USING (public.has_project_access(project_id));

CREATE POLICY "Project editors can manage relationships"
  ON public.relationships FOR ALL
  USING (public.can_edit_project(project_id));

-- ============================================================
-- EMBEDDINGS
-- ============================================================

CREATE POLICY "Project members can view embeddings"
  ON public.embeddings FOR SELECT
  USING (public.has_project_access(project_id));

CREATE POLICY "Project editors can manage embeddings"
  ON public.embeddings FOR ALL
  USING (public.can_edit_project(project_id));

-- ============================================================
-- CONTEXT SNAPSHOTS
-- ============================================================

CREATE POLICY "Project members can view context snapshots"
  ON public.context_snapshots FOR SELECT
  USING (public.has_project_access(project_id));

CREATE POLICY "Project editors can manage context snapshots"
  ON public.context_snapshots FOR ALL
  USING (public.can_edit_project(project_id));

-- ============================================================
-- CONVERSATIONS
-- ============================================================

CREATE POLICY "Project members can view conversations"
  ON public.conversations FOR SELECT
  USING (public.has_project_access(project_id));

CREATE POLICY "Project editors can manage conversations"
  ON public.conversations FOR ALL
  USING (public.can_edit_project(project_id));

-- ============================================================
-- API KEYS
-- ============================================================

CREATE POLICY "Project members can view api keys"
  ON public.api_keys FOR SELECT
  USING (public.has_project_access(project_id));

CREATE POLICY "Project owners can manage api keys"
  ON public.api_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = api_keys.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'owner'
    )
  );

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE POLICY "Project members can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_project_access(project_id));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.can_edit_project(project_id));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- COMMENTS
-- ============================================================

CREATE POLICY "Project members can view comments"
  ON public.comments FOR SELECT
  USING (public.has_project_access(project_id));

CREATE POLICY "Project members can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (
    public.has_project_access(project_id) AND auth.uid() = user_id
  );

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- REPOSITORIES & SUMMARIES
-- ============================================================

CREATE POLICY "Project members can view repositories"
  ON public.repositories FOR SELECT
  USING (public.has_project_access(project_id));

CREATE POLICY "Project editors can manage repositories"
  ON public.repositories FOR ALL
  USING (public.can_edit_project(project_id));

CREATE POLICY "Project members can view summaries"
  ON public.summaries FOR SELECT
  USING (public.has_project_access(project_id));

CREATE POLICY "Project editors can manage summaries"
  ON public.summaries FOR ALL
  USING (public.can_edit_project(project_id));
