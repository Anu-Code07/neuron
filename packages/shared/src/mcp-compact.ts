import type { ContextPacket, ScoredMemory, SearchMemoryResult } from './context.js';
import type { Memory } from './entities.js';
import type { SessionInsights, WorkspaceContextPacket } from './project-links.js';

/** Default max content chars in compact memory cards */
const CONTENT_SNIP = 280;

export interface CompactMemoryCard {
  id: string;
  type: string;
  title: string;
  summary?: string | null;
  score?: number;
  tags?: string[];
}

export interface CompactSearchResult {
  query: string;
  count: number;
  hits: CompactMemoryCard[];
  linkedProjects?: string[];
}

export interface CompactWorkspaceResult {
  repo?: string;
  task?: string;
  brief?: string;
  warnings?: string[];
  hits: CompactMemoryCard[];
  hints: string[];
  linked?: Array<{ project: string; hits: CompactMemoryCard[] }>;
}

export interface CompactAskResult {
  answer: string;
  sources: Array<{ id: string; title: string; type: string }>;
}

export function compactAskResult(result: CompactAskResult): CompactAskResult {
  return {
    answer: result.answer,
    sources: result.sources.slice(0, 8).map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
    })),
  };
}

export function compactMemoryCard(
  memory: Memory,
  score?: number,
  opts?: { includeContent?: boolean },
): CompactMemoryCard {
  const card: CompactMemoryCard = {
    id: memory.id,
    type: memory.type,
    title: memory.title,
    summary: memory.summary,
    score,
  };
  if (memory.tags?.length) card.tags = memory.tags.slice(0, 6);
  if (opts?.includeContent) {
    card.summary = memory.summary ?? memory.content.slice(0, CONTENT_SNIP);
  }
  return card;
}

export function compactSearchResult(result: SearchMemoryResult): CompactSearchResult {
  return {
    query: result.query,
    count: result.results.length,
    hits: result.results.map((r) => compactMemoryCard(r.memory, r.score)),
    linkedProjects: result.linkedProjectsSearched,
  };
}

export function compactScoredMemories(results: ScoredMemory[]): CompactMemoryCard[] {
  return results.map((r) => compactMemoryCard(r.memory, r.score));
}

export function compactWorkspace(
  workspace: WorkspaceContextPacket,
  sessionInsights?: SessionInsights,
): CompactWorkspaceResult {
  const packet = workspace.primary;
  const hits: CompactMemoryCard[] = [];

  for (const bug of packet.activeBugs ?? []) {
    hits.push({ id: bug.id, type: 'bug', title: bug.title, summary: bug.reproduction ?? bug.severity });
  }
  for (const d of packet.decisions ?? []) {
    hits.push({ id: d.id, type: 'decision', title: d.title, summary: d.chosen });
  }
  for (const f of packet.facts ?? []) {
    hits.push({ id: f.id, type: 'fact', title: f.title, summary: f.content.slice(0, CONTENT_SNIP) });
  }

  return {
    repo: workspace.scope.activeRepoTag,
    task: sessionInsights?.inferredTask,
    brief: packet.architecture?.summary ?? undefined,
    warnings: sessionInsights?.warnings,
    hits: sessionInsights?.relevantMemories?.length
      ? sessionInsights.relevantMemories.map((m) => ({
          id: m.id,
          type: m.type,
          title: m.title,
          summary: m.summary,
          score: m.score,
        }))
      : hits.slice(0, 8),
    hints: workspace.hints.slice(0, 4),
    linked: workspace.linked.map((l: WorkspaceContextPacket['linked'][number]) => ({
      project: l.projectName,
      hits: l.highlights.map((h) => ({
        id: h.id,
        type: h.type,
        title: h.title,
        summary: h.summary,
        score: h.score,
      })),
    })),
  };
}

export function compactContextPacket(packet: ContextPacket): CompactWorkspaceResult {
  return compactWorkspace({
    scope: { registeredRepos: [], linkedProjects: [] },
    primary: packet,
    linked: [],
    hints: [],
  });
}

export function compactRememberResult(memory: Memory) {
  return { ok: true, id: memory.id, type: memory.type, title: memory.title };
}

export type McpResponseFormat = 'brief' | 'compact' | 'full';

export function isCompactFormat(format?: string): boolean {
  return format !== 'full';
}

export function wantsGroqBrief(format?: string): boolean {
  return (format ?? 'brief') === 'brief';
}

/** Single-line JSON — ~30% fewer tokens than pretty-printed */
export function serializeMcpPayload(data: unknown, format?: McpResponseFormat): string {
  if (format === 'full') return JSON.stringify(data, null, 2);
  return JSON.stringify(data);
}
