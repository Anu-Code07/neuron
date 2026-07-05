import { MemoryStatus, ContextLayer, type Memory, type RememberInput } from '@neuron/shared';
import type {
  ContextEngineDeps,
  MemoryRepository,
  RelationshipRepository,
  EmbeddingRepository,
  ProjectRepository,
} from '@neuron/context-engine';

/** In-memory adapter for local development and testing without Supabase */
export function createInMemoryDeps(): ContextEngineDeps {
  const memories = new Map<string, Memory>();
  const relationships: Array<{
    projectId: string;
    sourceId: string;
    targetId: string;
    type: string;
  }> = [];
  const embeddings = new Map<string, { memoryId: string; vector: number[] }>();
  const projects = new Map<string, {
    id: string;
    name: string;
    slug: string;
    techStack: string[];
    description: string | null;
  }>();

  const defaultProject = {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Neuron',
    slug: 'neuron',
    techStack: ['Next.js', 'Supabase', 'TypeScript'],
    description: 'Context Operating System for AI',
  };
  projects.set(defaultProject.id, defaultProject);

  const memoryRepo: MemoryRepository = {
    async create(input: RememberInput) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const memory: Memory = {
        id,
        projectId: input.projectId,
        type: input.type as Memory['type'],
        layer: (input.layer ?? ContextLayer.Project) as Memory['layer'],
        title: input.title,
        content: input.content,
        summary: null,
        status: MemoryStatus.Active,
        confidence: input.confidence ?? 0.8,
        importance: input.importance ?? 0.5,
        accessCount: 0,
        lastAccessedAt: null,
        expiresAt: null,
        source: (input.source ?? { type: 'manual' }) as Memory['source'],
        metadata: input.metadata ?? {},
        tags: input.tags ?? [],
        createdAt: now,
        updatedAt: now,
      };
      memories.set(id, memory);
      return memory;
    },

    async findById(id) {
      return memories.get(id) ?? null;
    },

    async findByProject(projectId, filters) {
      let results = [...memories.values()].filter((m) => m.projectId === projectId);
      if (filters?.types) results = results.filter((m) => filters.types!.includes(m.type));
      if (filters?.status) results = results.filter((m) => m.status === filters.status);
      if (filters?.limit) results = results.slice(0, filters.limit);
      return results;
    },

    async update(id, data) {
      const existing = memories.get(id);
      if (!existing) throw new Error(`Memory not found: ${id}`);
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      memories.set(id, updated);
      return updated;
    },

    async forget({ memoryId }) {
      const existing = memories.get(memoryId);
      if (existing) {
        memories.set(memoryId, { ...existing, status: MemoryStatus.Forgotten });
      }
    },

    async merge({ sourceMemoryId, targetMemoryId, mergedTitle, mergedContent }) {
      const source = memories.get(sourceMemoryId);
      const target = memories.get(targetMemoryId);
      if (!source || !target) throw new Error('Memory not found for merge');

      const merged = {
        ...target,
        title: mergedTitle ?? target.title,
        content: mergedContent ?? `${target.content}\n${source.content}`,
        confidence: Math.max(source.confidence, target.confidence),
        updatedAt: new Date().toISOString(),
      };
      memories.set(targetMemoryId, merged);
      memories.set(sourceMemoryId, { ...source, status: MemoryStatus.Merged });
      return merged;
    },

    async search(input) {
      const all = await memoryRepo.findByProject(input.projectId, {
        types: input.types,
        status: MemoryStatus.Active,
      });
      const filtered = all.filter(
        (m) =>
          m.title.toLowerCase().includes(input.query.toLowerCase()) ||
          m.content.toLowerCase().includes(input.query.toLowerCase()),
      );
      return {
        results: filtered.map((m) => ({
          memory: m,
          score: 0.5,
          scoreBreakdown: {
            semanticSimilarity: 0,
            keywordMatch: 0.5,
            graphProximity: 0,
            recency: 0.5,
            importance: m.importance,
            layerPriority: 0.5,
            confidence: m.confidence,
            composite: 0.5,
          },
        })),
        totalCount: filtered.length,
        query: input.query,
      };
    },

    async incrementAccess(id) {
      const m = memories.get(id);
      if (m) {
        memories.set(id, {
          ...m,
          accessCount: m.accessCount + 1,
          lastAccessedAt: new Date().toISOString(),
        });
      }
    },
  };

  const relationshipRepo: RelationshipRepository = {
    async create(projectId, sourceId, targetId, type) {
      relationships.push({ projectId, sourceId, targetId, type });
    },

    async findByMemory(memoryId) {
      return relationships
        .filter((r) => r.sourceId === memoryId)
        .map((r) => ({ targetMemoryId: r.targetId, type: r.type }));
    },

    async findRelated(memoryIds, depth = 2) {
      const found = new Set<string>();
      let current = [...memoryIds];

      for (let d = 0; d < depth; d++) {
        const next: string[] = [];
        for (const id of current) {
          for (const r of relationships) {
            if (r.sourceId === id && !found.has(r.targetId)) {
              found.add(r.targetId);
              next.push(r.targetId);
            }
            if (r.targetId === id && !found.has(r.sourceId)) {
              found.add(r.sourceId);
              next.push(r.sourceId);
            }
          }
        }
        current = next;
      }

      return [...found];
    },
  };

  const embeddingRepo: EmbeddingRepository = {
    async create(memoryId, _projectId, vector, _model) {
      embeddings.set(memoryId, { memoryId, vector });
    },

    async search(_projectId, vector, limit) {
      const results: Array<{ memoryId: string; similarity: number }> = [];
      for (const [memoryId, emb] of embeddings) {
        const similarity = cosineSimilarity(vector, emb.vector);
        results.push({ memoryId, similarity });
      }
      return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
    },
  };

  const projectRepo: ProjectRepository = {
    async findById(id) {
      return projects.get(id) ?? null;
    },
  };

  return {
    memories: memoryRepo,
    relationships: relationshipRepo,
    embeddings: embeddingRepo,
    projects: projectRepo,
  };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}
