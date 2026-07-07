import type { ContextEngine } from '@neuron/context-engine';
import type { Memory, ContextPacket } from '@neuron/shared';
import { readNeuronRepoEnv } from '@neuron/shared';

const DEFAULT_API_URL = 'https://neuron-azure.vercel.app';

type HostedCallResult = Record<string, unknown>;

type HostedEngineOptions = {
  repoTag?: string;
  projectOverride?: string;
};

function scopeHeaders(options?: HostedEngineOptions): Record<string, string> {
  const headers: Record<string, string> = { ...mcpClientHeaders() };
  const repo = options?.repoTag ?? readNeuronRepoEnv();
  if (repo) headers['X-Neuron-Repo'] = repo;
  if (options?.projectOverride) headers['X-Neuron-Project-Id'] = options.projectOverride;
  return headers;
}

function mcpClientHeaders(): Record<string, string> {
  const client = process.env.NEURON_MCP_CLIENT?.trim();
  return client ? { 'X-Neuron-Client': client } : {};
}

async function hostedFetch(
  apiUrl: string,
  apiKey: string,
  tool: string,
  args: Record<string, unknown>,
  options?: HostedEngineOptions,
): Promise<HostedCallResult> {
  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/mcp`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...scopeHeaders(options),
    },
    body: JSON.stringify({ tool, args }),
  });

  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(body.error ?? `Neuron API error (${res.status})`);
  }
  return body;
}

export async function resolveHostedProjectId(apiUrl: string, apiKey: string): Promise<string> {
  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/mcp`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...mcpClientHeaders(),
    },
  });
  const body = (await res.json().catch(() => ({}))) as { project_id?: string; error?: string };
  if (!res.ok || !body.project_id) {
    throw new Error(body.error ?? 'Could not resolve project from NEURON_API_KEY');
  }
  return body.project_id;
}

/** HTTP proxy engine — all secrets stay on Neuron hosted backend */
export function createHostedEngine(
  apiUrl: string,
  apiKey: string,
  projectId: string,
  options?: HostedEngineOptions,
): ContextEngine {
  const base = apiUrl.replace(/\/$/, '') || DEFAULT_API_URL;

  const withProject = (args: Record<string, unknown>) => ({
    ...args,
    project_id: args.project_id ?? projectId,
  });

  const call = (tool: string, args: Record<string, unknown>) =>
    hostedFetch(base, apiKey, tool, args, options);

  const engine = {
    async remember(input: {
      projectId: string;
      type: string;
      title: string;
      content: string;
      confidence?: number;
      importance?: number;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }): Promise<Memory> {
      const tool = `remember_${input.type}`;
      const result = await call(tool, {
        project_id: input.projectId ?? projectId,
        title: input.title,
        content: input.content,
        confidence: input.confidence,
        importance: input.importance,
        tags: input.tags,
        metadata: input.metadata,
      });
      return (result.memory ?? result) as Memory;
    },

    async searchMemory(
      pid: string,
      query: string,
      opts?: {
        types?: string[];
        tags?: string[];
        requiredRepoTag?: string;
        includeLinkedProjects?: boolean;
        limit?: number;
        format?: string;
      },
    ) {
      return call('search_memory', withProject({
        project_id: pid || projectId,
        query,
        types: opts?.types,
        tags: opts?.tags,
        include_linked_projects: opts?.includeLinkedProjects,
        limit: opts?.limit,
        format: opts?.format,
      }));
    },

    async findMemory(
      pid: string,
      query: string,
      opts?: {
        types?: string[];
        tags?: string[];
        requiredRepoTag?: string;
        includeLinkedProjects?: boolean;
        limit?: number;
        withBrief?: boolean;
        format?: string;
      },
    ) {
      return call('find_memory', withProject({
        project_id: pid || projectId,
        query,
        types: opts?.types,
        tags: opts?.tags,
        include_linked_projects: opts?.includeLinkedProjects,
        limit: opts?.limit,
        format: opts?.format ?? (opts?.withBrief === false ? 'compact' : 'brief'),
      }));
    },

    async getProjectContext(input: {
      projectId: string;
      query?: string;
      taskDescription?: string;
      openFiles?: string[];
      branchName?: string;
      tokenBudget?: number;
      tags?: string[];
      requiredRepoTag?: string;
      includeLinkedProjects?: boolean;
    }): Promise<ContextPacket> {
      const result = await call('get_project_context', withProject({
        project_id: input.projectId || projectId,
        query: input.query,
        task_description: input.taskDescription,
        open_files: input.openFiles,
        branch_name: input.branchName,
        token_budget: input.tokenBudget,
        tags: input.tags,
        include_linked_projects: input.includeLinkedProjects,
      }));
      return (result.packet ?? result) as ContextPacket;
    },

    async getWorkspaceContext(input: {
      projectId: string;
      query?: string;
      taskDescription?: string;
      openFiles?: string[];
      branchName?: string;
      tokenBudget?: number;
      tags?: string[];
      requiredRepoTag?: string;
      includeLinkedProjects?: boolean;
    }) {
      return call('get_workspace_context', withProject({
        project_id: input.projectId || projectId,
        query: input.query,
        task_description: input.taskDescription,
        open_files: input.openFiles,
        branch_name: input.branchName,
        token_budget: input.tokenBudget,
        tags: input.tags,
        include_linked_projects: input.includeLinkedProjects,
      }));
    },

    async listRepos(pid: string) {
      const result = await call('list_repos', { project_id: pid || projectId });
      return (result.repos ?? []) as import('@neuron/shared').RegisteredRepo[];
    },

    async registerRepo(
      pid: string,
      input: { name: string; repoSlug: string; url?: string; defaultBranch?: string },
    ) {
      const result = await call('register_repo', withProject({
        project_id: pid || projectId,
        name: input.name,
        repo_slug: input.repoSlug,
        url: input.url,
        default_branch: input.defaultBranch,
      }));
      return result.repo as import('@neuron/shared').RegisteredRepo;
    },

    async deleteRepo(repoId: string) {
      await call('delete_repo', { repo_id: repoId });
    },

    async listProjectLinks(pid: string) {
      const result = await call('list_project_links', { project_id: pid || projectId });
      return (result.links ?? []) as import('@neuron/shared').ProjectLink[];
    },

    async linkProject(
      sourceId: string,
      targetId: string,
      linkType: import('@neuron/shared').ProjectLinkType,
      label?: string,
    ) {
      const result = await call('link_project', withProject({
        project_id: sourceId,
        target_project_id: targetId,
        link_type: linkType,
        label,
      }));
      return result.link as import('@neuron/shared').ProjectLink;
    },

    async unlinkProject(linkId: string) {
      await call('unlink_project', { link_id: linkId });
    },

    async resolveProjectBySlug(slug: string) {
      return null;
    },

    async findRelated(memoryId: string, depth?: number) {
      const result = await call('find_related', {
        memory_id: memoryId,
        depth,
      });
      return (result.memories ?? result) as Memory[];
    },

    async summarizeProject(pid: string): Promise<string> {
      const result = await call('summarize_project', {
        project_id: pid || projectId,
      });
      return (result.summary as string) ?? '';
    },

    async forget(memoryId: string, reason?: string): Promise<void> {
      await call('forget_memory', { memory_id: memoryId, reason });
    },

    async merge(sourceId: string, targetId: string, mergeOpts?: { force?: boolean }): Promise<Memory> {
      const result = await call('merge_memory', {
        source_memory_id: sourceId,
        target_memory_id: targetId,
        force: mergeOpts?.force,
      });
      return (result.memory ?? result) as Memory;
    },

    async findDuplicates(pid: string, memoryId?: string) {
      const result = await call('find_duplicates', withProject({
        project_id: pid || projectId,
        memory_id: memoryId,
      }));
      return (result.duplicates ?? []) as Array<{ memoryId: string; similarity: number; reason: string }>;
    },

    async extractMemoriesFromConversation(pid: string, conversation: string) {
      const result = await call('extract_memories', withProject({
        project_id: pid || projectId,
        conversation,
      }));
      return (result.extracted ?? []) as Memory[];
    },

    async previewExtractMemories(conversation: string) {
      const result = await call('preview_memories', { conversation });
      return (result.drafts ?? []) as Array<{
        type: string;
        title: string;
        content: string;
        tags?: string[];
      }>;
    },

    async suggestTags(title: string, content: string) {
      const result = await call('suggest_tags', { title, content });
      return (result.tags ?? []) as string[];
    },

    async askProject(pid: string, question: string, limit?: number) {
      const result = await call('ask_project', withProject({
        project_id: pid || projectId,
        question,
        limit,
      }));
      return result as { answer: string; sources: Array<{ id: string; title: string; type: string }> };
    },

    async suggestContext(
      pid: string,
      taskDescription: string,
      suggestOpts?: { openFiles?: string[]; limit?: number },
    ) {
      const result = await call('suggest_context', withProject({
        project_id: pid || projectId,
        task_description: taskDescription,
        open_files: suggestOpts?.openFiles,
        limit: suggestOpts?.limit,
      }));
      return result as {
        narrative: string;
        memories: Array<{ id: string; title: string; type: string; summary?: string; tags?: string[] }>;
      };
    },

    async condenseMemories(pid: string, memoryIds: string[], condenseOpts?: { save?: boolean }) {
      const result = await call('condense_memories', withProject({
        project_id: pid || projectId,
        memory_ids: memoryIds,
        save: condenseOpts?.save,
      }));
      return result as {
        draft: { type: string; title: string; content: string; tags?: string[] };
        memory?: Memory;
        forgottenIds?: string[];
      };
    },

    async suggestRelationships(pid: string, memoryId: string) {
      const result = await call('suggest_relationships', withProject({
        project_id: pid || projectId,
        memory_id: memoryId,
      }));
      return result as {
        memoryId: string;
        suggestions: Array<{ sourceMemoryId: string; targetMemoryId: string; type: string; reason: string }>;
      };
    },

    async previewExtractFromDiff(diff: string) {
      const result = await call('extract_from_diff', { diff, save: false });
      return (result.drafts ?? []) as Array<{ type: string; title: string; content: string; tags?: string[] }>;
    },

    async extractFromDiff(pid: string, diff: string) {
      const result = await call('extract_from_diff', withProject({
        project_id: pid || projectId,
        diff,
        save: true,
      }));
      return (result.extracted ?? []) as Memory[];
    },
  };

  return engine as unknown as ContextEngine;
}

export function isHostedMode(): boolean {
  return !!process.env.NEURON_API_KEY?.startsWith('nrn_');
}

export function getHostedConfig() {
  return {
    apiKey: process.env.NEURON_API_KEY!,
    apiUrl: process.env.NEURON_API_URL ?? DEFAULT_API_URL,
  };
}
