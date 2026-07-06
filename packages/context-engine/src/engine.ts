import {
  ContextLayer,
  MemoryStatus,
  MemoryType,
  ProjectLinkType,
  type ContextPacket,
  type ContextQuery,
  type DecisionMemory,
  type LinkedProjectContext,
  type Memory,
  type ProjectLink,
  type RegisteredRepo,
  type RememberInput,
  type WorkspaceContextPacket,
  type WorkspaceScope,
  normalizeRepoTag,
} from '@neuron/shared';

import type { ContextEngineDeps } from './domain/repositories.js';
import { extractKeywords, rankMemories, truncateToTokenBudget, estimateTokens } from './retrieval/scorer.js';
import { compressToPacket } from './compression/packet-builder.js';
import {
  answerFromMemories,
  condenseMemoriesWithLlm,
  enhanceContextNarrative,
  extractMemoriesFromDiff,
  extractMemoriesFromText,
  findDuplicateCandidates,
  generateMemorySummary,
  suggestMemoryTags,
  suggestRelationshipEdges,
  summarizeMemoriesWithLlm,
  type CondensedMemoryDraft,
  type ExtractedMemoryDraft,
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

    if (input.tags?.length && this.deps.workspaceRepos) {
      const repoTag = input.tags.find((t) => t.startsWith('repo:'));
      if (repoTag) {
        await this.deps.workspaceRepos.ensureRegistered(
          input.projectId,
          repoTag.replace(/^repo:/, ''),
        );
      }
    }

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
    options?: {
      types?: string[];
      tags?: string[];
      requiredRepoTag?: string;
      includeLinkedProjects?: boolean;
      limit?: number;
    },
  ) {
    const limit = options?.limit ?? 20;
    const primary = await this.searchProjectMemories(projectId, query, { ...options, limit });

    if (options?.includeLinkedProjects === false || !this.deps.projectLinks) {
      return primary;
    }

    const linkedIds = await this.deps.projectLinks.getLinkedProjectIds(projectId);
    if (!linkedIds.length) return primary;

    const merged = [...primary.results];
    const perLinked = Math.max(3, Math.ceil(limit / Math.max(linkedIds.length, 1)));

    for (const linkedId of linkedIds) {
      const linked = await this.searchProjectMemories(linkedId, query, {
        types: options?.types,
        limit: perLinked,
      });
      for (const result of linked.results) {
        merged.push({
          ...result,
          score: result.score * 0.85,
          scoreBreakdown: {
            ...result.scoreBreakdown,
            composite: result.scoreBreakdown.composite * 0.85,
          },
          memory: {
            ...result.memory,
            metadata: {
              ...result.memory.metadata,
              linkedFromProjectId: linkedId,
            },
          },
        });
      }
    }

    merged.sort((a, b) => b.score - a.score);
    return {
      results: merged.slice(0, limit),
      totalCount: merged.length,
      query,
      linkedProjectsSearched: linkedIds,
    };
  }

  private async searchProjectMemories(
    projectId: string,
    query: string,
    options?: {
      types?: string[];
      tags?: string[];
      requiredRepoTag?: string;
      limit?: number;
    },
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
      tags: options?.tags,
      requiredRepoTag: options?.requiredRepoTag,
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
      tags: query.tags,
      requiredRepoTag: query.requiredRepoTag,
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

  /** Preview memory drafts from conversation without saving */
  async previewExtractMemories(conversation: string): Promise<ExtractedMemoryDraft[]> {
    if (!this.deps.llm) {
      throw new Error('GROQ_API_KEY required for memory extraction');
    }
    return extractMemoriesFromText(this.deps.llm, conversation);
  }

  /** Suggest tags for a memory title and content */
  async suggestTags(title: string, content: string): Promise<string[]> {
    if (!this.deps.llm) {
      throw new Error('GROQ_API_KEY required for tag suggestions');
    }
    return suggestMemoryTags(this.deps.llm, title, content);
  }

  /** Answer a natural-language question using project memories (Groq + search) */
  async askProject(projectId: string, question: string, limit = 10) {
    if (!this.deps.llm) {
      throw new Error('GROQ_API_KEY required for ask_project');
    }

    const search = await this.searchMemory(projectId, question, { limit });
    const memories = search.results.map((r) => r.memory);
    const answer = await answerFromMemories(
      this.deps.llm,
      question,
      memories.map((m) => ({
        id: m.id,
        title: m.title,
        content: m.content,
        type: m.type,
      })),
    );

    return {
      answer,
      sources: memories.map((m) => ({
        id: m.id,
        title: m.title,
        type: m.type,
      })),
    };
  }

  /** Recommend memories to load for a task (Groq narrative + ranked list) */
  async suggestContext(
    projectId: string,
    taskDescription: string,
    options?: { openFiles?: string[]; limit?: number },
  ) {
    const limit = options?.limit ?? 8;
    const query = [taskDescription, ...(options?.openFiles ?? [])].filter(Boolean).join(' ');
    const search = await this.searchMemory(projectId, query, { limit });

    const memories = search.results.map((r) => r.memory);
    let narrative = '';

    if (this.deps.llm && memories.length) {
      const snippets = memories.map(
        (m) => `- ${m.title}: ${m.summary ?? m.content.slice(0, 200)}`,
      );
      narrative = await enhanceContextNarrative(this.deps.llm, taskDescription, snippets);
    }

    return {
      narrative,
      memories: memories.map((m) => ({
        id: m.id,
        title: m.title,
        type: m.type,
        summary: m.summary,
        tags: m.tags,
      })),
    };
  }

  /** Preview or save a condensed memory merged from several sources */
  async condenseMemories(
    projectId: string,
    memoryIds: string[],
    options?: { save?: boolean },
  ): Promise<{ draft: CondensedMemoryDraft; memory?: Memory; forgottenIds?: string[] }> {
    if (!this.deps.llm) {
      throw new Error('GROQ_API_KEY required for condense_memories');
    }
    if (memoryIds.length < 2 || memoryIds.length > 5) {
      throw new Error('Provide 2–5 memory IDs to condense');
    }

    const loaded = await Promise.all(memoryIds.map((id) => this.deps.memories.findById(id)));
    const memories = loaded.filter((m): m is Memory => m !== null);
    if (memories.length < 2) {
      throw new Error('Could not load enough memories to condense');
    }

    const draft = await condenseMemoriesWithLlm(
      this.deps.llm,
      memories.map((m) => ({
        id: m.id,
        title: m.title,
        content: m.content,
        type: m.type,
      })),
    );

    if (!options?.save) {
      return { draft, forgottenIds: memoryIds };
    }

    const saved = await this.remember({
      projectId,
      type: draft.type as RememberInput['type'],
      title: draft.title,
      content: draft.content,
      tags: draft.tags,
      layer: ContextLayer.Project,
      source: { type: 'condense', referenceId: memoryIds.join(',') },
    });

    for (const id of memoryIds) {
      await this.forget(id, `Condensed into ${saved.id}`);
    }

    return { draft, memory: saved, forgottenIds: memoryIds };
  }

  /** Suggest knowledge graph relationships for a memory */
  async suggestRelationships(projectId: string, memoryId: string) {
    if (!this.deps.llm) {
      throw new Error('GROQ_API_KEY required for suggest_relationships');
    }

    const focus = await this.deps.memories.findById(memoryId);
    if (!focus) throw new Error(`Memory not found: ${memoryId}`);

    const existing = await this.deps.relationships.findByMemory(memoryId);
    const existingTargets = existing.map((r) => r.targetMemoryId);

    const candidates = await this.deps.memories.findByProject(projectId, {
      status: MemoryStatus.Active,
      limit: 40,
    });

    const suggestions = await suggestRelationshipEdges(
      this.deps.llm,
      {
        id: focus.id,
        title: focus.title,
        content: focus.content,
        type: focus.type,
      },
      candidates.map((m) => ({
        id: m.id,
        title: m.title,
        content: m.content,
        type: m.type,
      })),
      existingTargets,
    );

    return {
      memoryId,
      suggestions: suggestions.map((s) => ({
        ...s,
        sourceMemoryId: memoryId,
      })),
    };
  }

  /** Preview memory drafts extracted from a git diff */
  async previewExtractFromDiff(diff: string): Promise<ExtractedMemoryDraft[]> {
    if (!this.deps.llm) {
      throw new Error('GROQ_API_KEY required for extract_from_diff');
    }
    return extractMemoriesFromDiff(this.deps.llm, diff);
  }

  /** Extract and save memories from a git diff */
  async extractFromDiff(projectId: string, diff: string): Promise<Memory[]> {
    const drafts = await this.previewExtractFromDiff(diff);
    const saved: Memory[] = [];

    for (const draft of drafts) {
      const memory = await this.remember({
        projectId,
        type: draft.type as RememberInput['type'],
        title: draft.title,
        content: draft.content,
        tags: draft.tags,
        layer: ContextLayer.Project,
        source: { type: 'diff' },
      });
      saved.push(memory);
    }

    return saved;
  }

  /** List registered repos (maps to NEURON_REPO tags) */
  async listRepos(projectId: string): Promise<RegisteredRepo[]> {
    if (!this.deps.workspaceRepos) return [];
    return this.deps.workspaceRepos.listByProject(projectId);
  }

  /** Register a repo under this project for NEURON_REPO scoping */
  async registerRepo(
    projectId: string,
    input: { name: string; repoSlug: string; url?: string; defaultBranch?: string },
  ): Promise<RegisteredRepo> {
    if (!this.deps.workspaceRepos) {
      throw new Error('Workspace repos not configured');
    }
    const slug = normalizeRepoTag(input.repoSlug)?.replace(/^repo:/, '') ?? input.repoSlug;
    return this.deps.workspaceRepos.create(projectId, { ...input, repoSlug: slug });
  }

  async deleteRepo(repoId: string): Promise<void> {
    if (!this.deps.workspaceRepos) throw new Error('Workspace repos not configured');
    await this.deps.workspaceRepos.delete(repoId);
  }

  /** List outgoing project links (host → package, etc.) */
  async listProjectLinks(projectId: string): Promise<ProjectLink[]> {
    if (!this.deps.projectLinks) return [];
    return this.deps.projectLinks.listOutgoing(projectId);
  }

  /** Link this project to another (e.g. host depends_on package) */
  async linkProject(
    sourceProjectId: string,
    targetProjectId: string,
    linkType: ProjectLinkType,
    label?: string,
  ): Promise<ProjectLink> {
    if (!this.deps.projectLinks) throw new Error('Project links not configured');
    return this.deps.projectLinks.create(sourceProjectId, targetProjectId, linkType, label);
  }

  async unlinkProject(linkId: string): Promise<void> {
    if (!this.deps.projectLinks) throw new Error('Project links not configured');
    await this.deps.projectLinks.delete(linkId);
  }

  /** Resolve target project by slug for link_project */
  async resolveProjectBySlug(slug: string) {
    if (!this.deps.projects.findBySlug) return null;
    return this.deps.projects.findBySlug(slug);
  }

  /** Full workspace context: repo scope + primary packet + linked project highlights */
  async getWorkspaceContext(query: ContextQuery): Promise<WorkspaceContextPacket> {
    const includeLinked = query.includeLinkedProjects !== false;

    if (query.requiredRepoTag && this.deps.workspaceRepos) {
      const slug = query.requiredRepoTag.replace(/^repo:/, '');
      await this.deps.workspaceRepos.ensureRegistered(query.projectId, slug);
    }

    const [repos, links, primary] = await Promise.all([
      this.listRepos(query.projectId),
      this.listProjectLinks(query.projectId),
      this.getProjectContext(query),
    ]);

    const scope: WorkspaceScope = {
      activeRepoTag: query.requiredRepoTag,
      registeredRepos: repos.map((r) => ({
        name: r.name,
        slug: r.repoSlug ?? r.name,
        url: r.url,
      })),
      linkedProjects: links.map((l) => ({
        id: l.targetProject?.id ?? l.targetProjectId,
        name: l.targetProject?.name ?? l.targetProjectId,
        slug: l.targetProject?.slug ?? '',
        linkType: l.linkType,
        label: l.label,
      })),
    };

    const linked: LinkedProjectContext[] = [];
    if (includeLinked && this.deps.projectLinks) {
      const linkedIds = await this.deps.projectLinks.getLinkedProjectIds(query.projectId);
      const focus = query.query ?? query.taskDescription ?? 'architecture bugs decisions';

      for (const linkedId of linkedIds) {
        const link = links.find((l) => l.targetProjectId === linkedId);
        const project = await this.deps.projects.findById(linkedId);
        if (!project) continue;

        const search = await this.searchProjectMemories(linkedId, focus, {
          types: [MemoryType.Bug, MemoryType.Decision, MemoryType.Architecture, MemoryType.Fact],
          limit: 6,
        });

        linked.push({
          projectId: linkedId,
          projectName: project.name,
          projectSlug: project.slug,
          linkType: link?.linkType ?? ProjectLinkType.DependsOn,
          highlights: search.results.map((r) => ({
            id: r.memory.id,
            title: r.memory.title,
            type: r.memory.type,
            summary: r.memory.summary,
            score: r.score,
          })),
        });
      }
    }

    const hints: string[] = [];
    if (query.requiredRepoTag) {
      hints.push(`Scoped to ${query.requiredRepoTag} — memories tagged on write and filtered on read.`);
    } else if (repos.length > 1) {
      hints.push(`Set NEURON_REPO to one of: ${repos.map((r) => r.repoSlug ?? r.name).join(', ')}`);
    }
    if (links.length) {
      hints.push(
        `${links.length} linked project(s) — search_memory and get_workspace_context include their highlights by default.`,
      );
    }
    if (!repos.length) {
      hints.push('Run register_repo or set NEURON_REPO to auto-register repos in this project.');
    }

    return { scope, primary, linked, hints };
  }
}
