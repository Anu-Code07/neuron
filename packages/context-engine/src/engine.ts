import {
  ContextLayer,
  MemoryStatus,
  MemoryType,
  type ContextPacket,
  type ContextQuery,
  type DecisionMemory,
  type Memory,
  type RememberInput,
} from '@neuron/shared';

import type { ContextEngineDeps } from './domain/repositories.js';
import { extractKeywords, rankMemories, truncateToTokenBudget, estimateTokens } from './retrieval/scorer.js';
import { compressToPacket } from './compression/packet-builder.js';
import {
  enhanceContextNarrative,
  extractMemoriesFromText,
  findDuplicateCandidates,
  generateMemorySummary,
  suggestMemoryTags,
  summarizeMemoriesWithLlm,
} from './ai/llm-tasks.js';
import { rerankMemoriesWithLlm } from './ai/llm-rerank.js';

const DEFAULT_TOKEN_BUDGET = 4000;

export class ContextEngine {
  constructor(private readonly deps: ContextEngineDeps) {}

  /** Store a new memory with optional relationships and embedding */
  async remember(input: RememberInput): Promise<Memory> {
    const memory = await this.deps.memories.create({
      ...input,
      layer: input.layer ?? ContextLayer.Project,
      confidence: input.confidence ?? 0.8,
      importance: input.importance ?? 0.5,
    });

    if (input.relationships) {
      for (const rel of input.relationships) {
        await this.deps.relationships.create(
          input.projectId,
          memory.id,
          rel.targetMemoryId,
          rel.type,
        );
      }
    }

    if (this.deps.embeddingProvider) {
      try {
        const text = `${memory.title}\n${memory.content}`;
        const vector = await this.deps.embeddingProvider.embed(text);
        await this.deps.embeddings.create(
          memory.id,
          input.projectId,
          vector,
          this.deps.embeddingProvider.model,
        );
      } catch (err) {
        console.warn('Embedding skipped:', err instanceof Error ? err.message : err);
      }
    }

    if (this.deps.llm && !memory.summary) {
      try {
        const summary = await generateMemorySummary(this.deps.llm, memory.title, memory.content);
        const tags = input.tags?.length
          ? input.tags
          : await suggestMemoryTags(this.deps.llm, memory.title, memory.content);
        return await this.deps.memories.update(memory.id, { summary, tags });
      } catch (err) {
        console.warn('AI memory enrichment skipped:', err instanceof Error ? err.message : err);
      }
    }

    return memory;
  }

  /** Search memories with hybrid retrieval */
  async searchMemory(
    projectId: string,
    query: string,
    options?: { types?: string[]; limit?: number },
  ) {
    const keywords = extractKeywords(query);
    const signals = {
      queryKeywords: keywords,
      seedMemoryIds: [] as string[],
      relatedMemoryIds: [] as string[],
      openFiles: [] as string[],
    };

    let semanticScores = new Map<string, number>();

    if (this.deps.embeddingProvider && query) {
      const queryVector = await this.deps.embeddingProvider.embed(query);
      const vectorResults = await this.deps.embeddings.search(
        projectId,
        queryVector,
        options?.limit ?? 20,
      );
      semanticScores = new Map(vectorResults.map((r) => [r.memoryId, r.similarity]));
    }

    const memories = await this.deps.memories.findByProject(projectId, {
      types: options?.types,
      status: MemoryStatus.Active,
      limit: 100,
    });

    let results = rankMemories(memories, signals, semanticScores);
    const limit = options?.limit ?? 20;

    if (this.deps.llm && query.trim()) {
      try {
        results = await rerankMemoriesWithLlm(
          this.deps.llm,
          query,
          results.map((r) => r.memory),
          limit,
        );
      } catch (err) {
        console.warn('LLM rerank skipped:', err instanceof Error ? err.message : err);
        results = results.slice(0, limit);
      }
    } else {
      results = results.slice(0, limit);
    }

    return {
      results,
      totalCount: results.length,
      query,
    };
  }

  /** Assemble an AI-ready context packet */
  async getProjectContext(query: ContextQuery): Promise<ContextPacket> {
    const project = await this.deps.projects.findById(query.projectId);
    if (!project) {
      throw new Error(`Project not found: ${query.projectId}`);
    }

    const tokenBudget = query.tokenBudget ?? DEFAULT_TOKEN_BUDGET;
    const keywords = extractKeywords(
      [query.query, query.taskDescription, ...(query.openFiles ?? [])]
        .filter(Boolean)
        .join(' '),
    );

    const seedIds: string[] = [];
    const relatedIds: string[] = [];

    if (query.openFiles?.length) {
      const fileMemories = await this.deps.memories.findByProject(query.projectId, {
        types: [MemoryType.File],
        limit: 50,
      });
      for (const fm of fileMemories) {
        const path = (fm.metadata as { path?: string }).path;
        if (path && query.openFiles.some((f) => f.includes(path) || path.includes(f))) {
          seedIds.push(fm.id);
          const related = await this.deps.relationships.findRelated([fm.id], 2);
          relatedIds.push(...related);
        }
      }
    }

    const signals = {
      queryKeywords: keywords,
      seedMemoryIds: seedIds,
      relatedMemoryIds: relatedIds,
      openFiles: query.openFiles ?? [],
      branchName: query.branchName,
      layerFilter: query.layerFilter,
    };

    let semanticScores = new Map<string, number>();
    if (this.deps.embeddingProvider && query.query) {
      const queryVector = await this.deps.embeddingProvider.embed(query.query);
      const vectorResults = await this.deps.embeddings.search(query.projectId, queryVector, 30);
      semanticScores = new Map(vectorResults.map((r) => [r.memoryId, r.similarity]));
    }

    const allMemories = await this.deps.memories.findByProject(query.projectId, {
      status: MemoryStatus.Active,
      limit: 200,
    });

    const scored = rankMemories(allMemories, signals, semanticScores);
    const selected = truncateToTokenBudget(
      scored,
      tokenBudget,
      (s) => `${s.memory.title}: ${s.memory.content}`,
    );

    for (const s of selected) {
      await this.deps.memories.incrementAccess(s.memory.id);
    }

    const packet = compressToPacket(project, selected, query);

    if (this.deps.llm && (query.query || query.taskDescription)) {
      try {
        const focus = query.query ?? query.taskDescription ?? '';
        const snippets = selected.map(
          (s) => `- ${s.memory.title}: ${s.memory.summary ?? s.memory.content.slice(0, 200)}`,
        );
        const narrative = await enhanceContextNarrative(this.deps.llm, focus, snippets);
        packet.architecture = {
          summary: narrative,
          layers: packet.architecture?.layers ?? [],
          patterns: packet.architecture?.patterns ?? [],
          keyDecisions: packet.architecture?.keyDecisions ?? [],
        };
        packet.tokenEstimate = estimateTokens(JSON.stringify(packet));
      } catch (err) {
        console.warn('AI context narrative skipped:', err instanceof Error ? err.message : err);
      }
    }

    return packet;
  }

  /** Mark a memory as forgotten */
  async forget(memoryId: string, reason?: string): Promise<void> {
    await this.deps.memories.forget({ memoryId, reason });
  }

  /** Merge two memories — checks duplicates unless force=true */
  async merge(sourceId: string, targetId: string, options?: { force?: boolean }): Promise<Memory> {
    if (!options?.force && this.deps.llm) {
      const dupes = await this.findDuplicates(
        (await this.deps.memories.findById(sourceId))?.projectId ?? '',
        sourceId,
      );
      const match = dupes.find((d) => d.memoryId === targetId);
      if (!match || match.similarity < 0.6) {
        throw new Error(
          `Memories may not be duplicates (similarity ${match?.similarity ?? 0}). Pass force=true to merge anyway.`,
        );
      }
    }

    return this.deps.memories.merge({
      sourceMemoryId: sourceId,
      targetMemoryId: targetId,
    });
  }

  /** Find memories related to a given memory via graph traversal */
  async findRelated(memoryId: string, depth = 2) {
    const relatedIds = await this.deps.relationships.findRelated([memoryId], depth);
    const memories = await Promise.all(
      relatedIds.map((id) => this.deps.memories.findById(id)),
    );
    return memories.filter((m): m is Memory => m !== null);
  }

  /** Summarize project knowledge into a compact overview */
  async summarizeProject(projectId: string): Promise<string> {
    const memories = await this.deps.memories.findByProject(projectId, {
      status: MemoryStatus.Active,
      limit: 50,
    });

    const decisions = memories.filter((m) => m.type === MemoryType.Decision);
    const architecture = memories.filter((m) => m.type === MemoryType.Architecture);
    const bugs = memories.filter((m) => m.type === MemoryType.Bug);

    const lines: string[] = [];

    if (architecture.length) {
      lines.push('## Architecture');
      architecture.forEach((a) => lines.push(`- ${a.title}: ${a.summary ?? a.content}`));
    }

    if (decisions.length) {
      lines.push('## Key Decisions');
      decisions.forEach((d) => {
        const meta = d as DecisionMemory;
        lines.push(`- ${d.title}: chose ${meta.metadata?.chosen ?? d.content}`);
      });
    }

    if (bugs.length) {
      lines.push('## Open Bugs');
      bugs
        .filter((b) => (b.metadata as { status?: string }).status === 'open')
        .forEach((b) => lines.push(`- [${(b.metadata as { severity?: string }).severity}] ${b.title}`));
    }

    const raw = lines.join('\n');

    if (this.deps.llm) {
      try {
        const project = await this.deps.projects.findById(projectId);
        return await summarizeMemoriesWithLlm(this.deps.llm, raw, project?.name);
      } catch (err) {
        console.warn('AI summarize skipped:', err instanceof Error ? err.message : err);
      }
    }

    return raw || 'No project memories stored yet.';
  }

  /** Find likely duplicate memories using Groq */
  async findDuplicates(projectId: string, memoryId?: string) {
    const memories = await this.deps.memories.findByProject(projectId, {
      status: MemoryStatus.Active,
      limit: 80,
    });

    if (!this.deps.llm || memories.length < 2) return [];

    const focus = memoryId ? memories.find((m) => m.id === memoryId) : memories[0];
    if (!focus) return [];

    try {
      return await findDuplicateCandidates(this.deps.llm, focus, memories);
    } catch (err) {
      console.warn('Duplicate detection skipped:', err instanceof Error ? err.message : err);
      return [];
    }
  }

  /** Extract structured memories from a Cursor/AI conversation transcript */
  async extractMemoriesFromConversation(projectId: string, conversation: string) {
    if (!this.deps.llm) {
      throw new Error('GROQ_API_KEY required for memory extraction');
    }

    const drafts = await extractMemoriesFromText(this.deps.llm, conversation);
    const saved: Memory[] = [];

    for (const draft of drafts) {
      const memory = await this.remember({
        projectId,
        type: draft.type as RememberInput['type'],
        title: draft.title,
        content: draft.content,
        tags: draft.tags,
        layer: ContextLayer.Project,
        source: { type: 'conversation' },
      });
      saved.push(memory);
    }

    return saved;
  }
}
