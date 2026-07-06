import type { ProjectLink, ProjectLinkType, RegisteredRepo } from '@neuron/shared';
import type { NeuronSupabaseClient } from '../client.js';

export interface ProjectLinkRepository {
  listOutgoing(projectId: string): Promise<ProjectLink[]>;
  getLinkedProjectIds(projectId: string): Promise<string[]>;
  create(
    sourceProjectId: string,
    targetProjectId: string,
    linkType: ProjectLinkType,
    label?: string,
  ): Promise<ProjectLink>;
  delete(linkId: string): Promise<void>;
}

export interface WorkspaceRepoRepository {
  listByProject(projectId: string): Promise<RegisteredRepo[]>;
  findBySlug(projectId: string, repoSlug: string): Promise<RegisteredRepo | null>;
  ensureRegistered(
    projectId: string,
    repoSlug: string,
    name?: string,
  ): Promise<RegisteredRepo>;
  create(
    projectId: string,
    input: { name: string; repoSlug: string; url?: string; defaultBranch?: string },
  ): Promise<RegisteredRepo>;
  delete(repoId: string): Promise<void>;
}

function rowToLink(row: {
  id: string;
  source_project_id: string;
  target_project_id: string;
  link_type: string;
  label: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  projects?: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[];
}): ProjectLink {
  const target = Array.isArray(row.projects) ? row.projects[0] : row.projects;
  return {
    id: row.id,
    sourceProjectId: row.source_project_id,
    targetProjectId: row.target_project_id,
    linkType: row.link_type as ProjectLink['linkType'],
    label: row.label,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    targetProject: target ?? undefined,
  };
}

function rowToRepo(row: {
  id: string;
  project_id: string;
  name: string;
  repo_slug: string | null;
  url: string | null;
  default_branch: string;
  provider: string;
  created_at: string;
  updated_at: string;
}): RegisteredRepo {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    repoSlug: row.repo_slug,
    url: row.url,
    defaultBranch: row.default_branch,
    provider: row.provider,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createProjectLinkRepository(client: NeuronSupabaseClient): ProjectLinkRepository {
  return {
    async listOutgoing(projectId) {
      const { data, error } = await client
        .from('project_links')
        .select(
          'id, source_project_id, target_project_id, link_type, label, metadata, created_at, updated_at, projects:target_project_id(id, name, slug)',
        )
        .eq('source_project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => rowToLink(row as never));
    },

    async getLinkedProjectIds(projectId) {
      const { data, error } = await client
        .from('project_links')
        .select('target_project_id')
        .eq('source_project_id', projectId);

      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => r.target_project_id as string);
    },

    async create(sourceProjectId, targetProjectId, linkType, label) {
      const { data, error } = await client
        .from('project_links')
        .insert({
          source_project_id: sourceProjectId,
          target_project_id: targetProjectId,
          link_type: linkType,
          label: label ?? null,
        })
        .select(
          'id, source_project_id, target_project_id, link_type, label, metadata, created_at, updated_at',
        )
        .single();

      if (error) throw new Error(error.message);
      return rowToLink(data as never);
    },

    async delete(linkId) {
      const { error } = await client.from('project_links').delete().eq('id', linkId);
      if (error) throw new Error(error.message);
    },
  };
}

export function createWorkspaceRepoRepository(client: NeuronSupabaseClient): WorkspaceRepoRepository {
  return {
    async listByProject(projectId) {
      const { data, error } = await client
        .from('repositories')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => rowToRepo(row as never));
    },

    async findBySlug(projectId, repoSlug) {
      const { data, error } = await client
        .from('repositories')
        .select('*')
        .eq('project_id', projectId)
        .eq('repo_slug', repoSlug)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data ? rowToRepo(data as never) : null;
    },

    async ensureRegistered(projectId, repoSlug, name) {
      const existing = await this.findBySlug(projectId, repoSlug);
      if (existing) return existing;
      return this.create(projectId, { name: name ?? repoSlug, repoSlug });
    },

    async create(projectId, input) {
      const { data, error } = await client
        .from('repositories')
        .insert({
          project_id: projectId,
          name: input.name,
          repo_slug: input.repoSlug,
          url: input.url ?? null,
          default_branch: input.defaultBranch ?? 'main',
          provider: 'local',
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return rowToRepo(data as never);
    },

    async delete(repoId) {
      const { error } = await client.from('repositories').delete().eq('id', repoId);
      if (error) throw new Error(error.message);
    },
  };
}
