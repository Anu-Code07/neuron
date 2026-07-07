import type { ContextEngine } from '@neuron/context-engine';
import {
  compactAskResult,
  compactContextPacket,
  compactRememberResult,
  compactSearchResult,
  compactWorkspace,
  isCompactFormat,
  serializeMcpPayload,
  wantsGroqBrief,
  type McpResponseFormat,
} from '@neuron/shared';
import type { WorkspaceContextPacket } from '@neuron/shared';

export function resolveMcpFormat(
  explicit?: string,
  env = process.env.NEURON_MCP_FORMAT,
): McpResponseFormat {
  const value = (explicit ?? env ?? 'brief').toLowerCase();
  if (value === 'full' || value === 'compact' || value === 'brief') return value;
  return 'brief';
}

export function mcpText(data: unknown, format?: McpResponseFormat) {
  return {
    content: [{ type: 'text' as const, text: serializeMcpPayload(data, format) }],
  };
}

export async function formatSearchResponse(
  engine: ContextEngine,
  projectId: string,
  query: string,
  raw: Awaited<ReturnType<ContextEngine['searchMemory']>>,
  format: McpResponseFormat,
) {
  if (format === 'full') return raw;
  if (format === 'brief') {
    const found = await engine.findMemory(projectId, query, {
      limit: raw.results.length,
      withBrief: true,
      includeLinkedProjects: false,
    });
    return { query: found.query, brief: found.brief, count: found.count, hits: found.hits };
  }
  return compactSearchResult(raw);
}

export function formatWorkspaceResponse(
  workspace: WorkspaceContextPacket,
  format: McpResponseFormat,
) {
  if (format === 'full') return workspace;
  return compactWorkspace(workspace, workspace.sessionInsights);
}

export function formatContextResponse(
  packet: Parameters<typeof compactContextPacket>[0],
  format: McpResponseFormat,
) {
  if (format === 'full') return packet;
  return compactContextPacket(packet);
}

export function formatRememberResponse(
  memory: Parameters<typeof compactRememberResult>[0],
  format: McpResponseFormat,
) {
  if (format === 'full') return { success: true, memory };
  return compactRememberResult(memory);
}

export function formatAskResponse(
  result: { answer: string; sources: Array<{ id: string; title: string; type: string }> },
  format: McpResponseFormat,
) {
  if (format === 'full') return result;
  return compactAskResult(result);
}

export { isCompactFormat, wantsGroqBrief };
