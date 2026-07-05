import {
  isApiMemory,
  isBugMemory,
  isComponentMemory,
  isDecisionMemory,
  isTaskMemory,
  toApiSummary,
  toBugSummary,
  toComponentSummary,
  toDecisionSummary,
  toTaskSummary,
  MemoryType,
  type ContextPacket,
  type ContextQuery,
  type ScoredMemory,
} from '@neuron/shared';

import { estimateTokens } from '../retrieval/scorer.js';

interface ProjectInfo {
  id: string;
  name: string;
  slug: string;
  techStack: string[];
  description: string | null;
}

export function compressToPacket(
  project: ProjectInfo,
  scoredMemories: ScoredMemory[],
  query: ContextQuery,
): ContextPacket {
  const memories = scoredMemories.map((s) => s.memory);

  const architectureMemories = memories.filter((m) => m.type === MemoryType.Architecture);
  const decisionMemories = memories.filter(isDecisionMemory);
  const patternMemories = memories.filter((m) => m.type === MemoryType.Pattern || m.type === MemoryType.CodingStandard);
  const factMemories = memories.filter((m) => m.type === MemoryType.Fact);
  const bugMemories = memories.filter(isBugMemory);
  const apiMemories = memories.filter(isApiMemory);
  const componentMemories = memories.filter(isComponentMemory);
  const taskMemories = memories.filter(isTaskMemory);

  const activeTask = query.taskDescription
    ? taskMemories.find((t) => t.metadata?.status !== 'done') ?? taskMemories[0]
    : taskMemories.find((t) => t.metadata?.status === 'in_progress') ?? null;

  const packet: ContextPacket = {
    project: {
      id: project.id,
      name: project.name,
      slug: project.slug,
      techStack: project.techStack,
      description: project.description,
    },
    architecture: architectureMemories.length
      ? {
          summary: architectureMemories.map((a) => a.summary ?? a.content).join('; '),
          layers: architectureMemories.flatMap((a) => (a.metadata?.layers as string[]) ?? []),
          patterns: architectureMemories.flatMap((a) => (a.metadata?.patterns as string[]) ?? []),
          keyDecisions: decisionMemories.slice(0, 5).map((d) => d.title),
        }
      : null,
    decisions: decisionMemories.map(toDecisionSummary),
    conventions: patternMemories.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.summary ?? p.content,
      examples: (p.metadata?.examples as string[]) ?? undefined,
    })),
    facts: factMemories.map((f) => ({
      id: f.id,
      title: f.title,
      content: f.content,
      confidence: f.confidence,
    })),
    activeBugs: bugMemories
      .filter((b) => b.metadata?.status === 'open' || b.metadata?.status === 'in_progress')
      .map(toBugSummary),
    relevantApis: apiMemories.map(toApiSummary),
    relatedComponents: componentMemories.map(toComponentSummary),
    currentTask: activeTask ? toTaskSummary(activeTask) : null,
    recentChanges: (query.recentEdits ?? []).map((e) => ({
      filePath: e.filePath,
      changeType: e.changeType,
      timestamp: e.timestamp,
    })),
    dependencies: [],
    relationships: [],
    tokenEstimate: 0,
    generatedAt: new Date().toISOString(),
  };

  packet.tokenEstimate = estimateTokens(JSON.stringify(packet));
  return packet;
}
