import type { ContextEngine } from '@neuron/context-engine';
import type { Memory, ContextPacket } from '@neuron/shared';

const DEFAULT_API_URL = 'https://neuron-azure.vercel.app';

type HostedCallResult = Record<string, unknown>;

function mcpClientHeaders(): Record<string, string> {
  const client = process.env.NEURON_MCP_CLIENT?.trim();
  return client ? { 'X-Neuron-Client': client } : {};
}

async function hostedFetch(
  apiUrl: string,
  apiKey: string,
  tool: string,
  args: Record<string, unknown>,
): Promise<HostedCallResult> {
  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/mcp`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...mcpClientHeaders(),
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
export function createHostedEngine(apiUrl: string, apiKey: string, projectId: string): ContextEngine {
  const base = apiUrl.replace(/\/$/, '') || DEFAULT_API_URL;

  const withProject = (args: Record<string, unknown>) => ({
    ...args,
    project_id: args.project_id ?? projectId,
  });

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
      const result = await hostedFetch(base, apiKey, tool, {
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
      opts?: { types?: string[]; limit?: number },
    ): Promise<unknown[]> {
      const result = await hostedFetch(base, apiKey, 'search_memory', withProject({
        project_id: pid || projectId,
        query,
        types: opts?.types,
        limit: opts?.limit,
      }));
      return Array.isArray(result) ? result : [];
    },

    async getProjectContext(input: {
      projectId: string;
      query?: string;
      taskDescription?: string;
      openFiles?: string[];
      branchName?: string;
      tokenBudget?: number;
    }): Promise<ContextPacket> {
      const result = await hostedFetch(base, apiKey, 'get_project_context', withProject({
        project_id: input.projectId || projectId,
        query: input.query,
        task_description: input.taskDescription,
        open_files: input.openFiles,
        branch_name: input.branchName,
        token_budget: input.tokenBudget,
      }));
      return (result.packet ?? result) as ContextPacket;
    },

    async findRelated(memoryId: string, depth?: number) {
      const result = await hostedFetch(base, apiKey, 'find_related', {
        memory_id: memoryId,
        depth,
      });
      return (result.memories ?? result) as Memory[];
    },

    async summarizeProject(pid: string): Promise<string> {
      const result = await hostedFetch(base, apiKey, 'summarize_project', {
        project_id: pid || projectId,
      });
      return (result.summary as string) ?? '';
    },

    async forget(memoryId: string, reason?: string): Promise<void> {
      await hostedFetch(base, apiKey, 'forget_memory', { memory_id: memoryId, reason });
    },

    async merge(sourceId: string, targetId: string, options?: { force?: boolean }): Promise<Memory> {
      const result = await hostedFetch(base, apiKey, 'merge_memory', {
        source_memory_id: sourceId,
        target_memory_id: targetId,
        force: options?.force,
      });
      return (result.memory ?? result) as Memory;
    },

    async findDuplicates(pid: string, memoryId?: string) {
      const result = await hostedFetch(base, apiKey, 'find_duplicates', withProject({
        project_id: pid || projectId,
        memory_id: memoryId,
      }));
      return (result.duplicates ?? []) as Array<{ memoryId: string; similarity: number; reason: string }>;
    },

    async extractMemoriesFromConversation(pid: string, conversation: string) {
      const result = await hostedFetch(base, apiKey, 'extract_memories', withProject({
        project_id: pid || projectId,
        conversation,
      }));
      return (result.extracted ?? []) as Memory[];
    },

    async previewExtractMemories(conversation: string) {
      const result = await hostedFetch(base, apiKey, 'preview_memories', { conversation });
      return (result.drafts ?? []) as Array<{
        type: string;
        title: string;
        content: string;
        tags?: string[];
      }>;
    },

    async suggestTags(title: string, content: string) {
      const result = await hostedFetch(base, apiKey, 'suggest_tags', { title, content });
      return (result.tags ?? []) as string[];
    },

    async askProject(pid: string, question: string, limit?: number) {
      const result = await hostedFetch(base, apiKey, 'ask_project', withProject({
        project_id: pid || projectId,
        question,
        limit,
      }));
      return result as { answer: string; sources: Array<{ id: string; title: string; type: string }> };
    },

    async suggestContext(
      pid: string,
      taskDescription: string,
      options?: { openFiles?: string[]; limit?: number },
    ) {
      const result = await hostedFetch(base, apiKey, 'suggest_context', withProject({
        project_id: pid || projectId,
        task_description: taskDescription,
        open_files: options?.openFiles,
        limit: options?.limit,
      }));
      return result as {
        narrative: string;
        memories: Array<{ id: string; title: string; type: string; summary?: string; tags?: string[] }>;
      };
    },

    async condenseMemories(pid: string, memoryIds: string[], options?: { save?: boolean }) {
      const result = await hostedFetch(base, apiKey, 'condense_memories', withProject({
        project_id: pid || projectId,
        memory_ids: memoryIds,
        save: options?.save,
      }));
      return result as {
        draft: { type: string; title: string; content: string; tags?: string[] };
        memory?: Memory;
        forgottenIds?: string[];
      };
    },

    async suggestRelationships(pid: string, memoryId: string) {
      const result = await hostedFetch(base, apiKey, 'suggest_relationships', withProject({
        project_id: pid || projectId,
        memory_id: memoryId,
      }));
      return result as {
        memoryId: string;
        suggestions: Array<{ sourceMemoryId: string; targetMemoryId: string; type: string; reason: string }>;
      };
    },

    async previewExtractFromDiff(diff: string) {
      const result = await hostedFetch(base, apiKey, 'extract_from_diff', { diff, save: false });
      return (result.drafts ?? []) as Array<{ type: string; title: string; content: string; tags?: string[] }>;
    },

    async extractFromDiff(pid: string, diff: string) {
      const result = await hostedFetch(base, apiKey, 'extract_from_diff', withProject({
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
