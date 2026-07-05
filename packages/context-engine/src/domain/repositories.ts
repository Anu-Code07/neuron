import type {
  ContextPacket,
  ContextQuery,
  ForgetMemoryInput,
  Memory,
  MergeMemoryInput,
  RememberInput,
  ScoredMemory,
  ScoreBreakdown,
  SearchMemoryInput,
  SearchMemoryResult,
} from '@neuron/shared';

/** Storage abstraction — implemented by Supabase or SQLite */
export interface MemoryRepository {
  create(input: RememberInput): Promise<Memory>;
  findById(id: string): Promise<Memory | null>;
  findByProject(projectId: string, filters?: MemoryFilters): Promise<Memory[]>;
  update(id: string, data: Partial<Memory>): Promise<Memory>;
  forget(input: ForgetMemoryInput): Promise<void>;
  merge(input: MergeMemoryInput): Promise<Memory>;
  search(input: SearchMemoryInput): Promise<SearchMemoryResult>;
  incrementAccess(id: string): Promise<void>;
}

export interface MemoryFilters {
  types?: string[];
  status?: string;
  layer?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface RelationshipRepository {
  create(projectId: string, sourceId: string, targetId: string, type: string): Promise<void>;
  findByMemory(memoryId: string): Promise<Array<{ targetMemoryId: string; type: string }>>;
  findRelated(memoryIds: string[], depth?: number): Promise<string[]>;
}

export interface EmbeddingRepository {
  create(memoryId: string, projectId: string, vector: number[], model: string): Promise<void>;
  search(projectId: string, vector: number[], limit: number): Promise<Array<{ memoryId: string; similarity: number }>>;
}

export interface ProjectRepository {
  findById(id: string): Promise<{
    id: string;
    name: string;
    slug: string;
    techStack: string[];
    description: string | null;
  } | null>;
}

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  readonly model: string;
}

export interface ContextEngineDeps {
  memories: MemoryRepository;
  relationships: RelationshipRepository;
  embeddings: EmbeddingRepository;
  projects: ProjectRepository;
  embeddingProvider?: EmbeddingProvider;
}
