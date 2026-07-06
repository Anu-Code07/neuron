import {
  ContextLayer,
  MemoryStatus,
  contextLayerFromDb,
  contextLayerToDb,
  type Memory,
  type RememberInput,
  type ForgetMemoryInput,
  type MergeMemoryInput,
  type SearchMemoryInput,
  type SearchMemoryResult,
} from '@neuron/shared';
import type { MemoryFilters, MemoryRepository } from '@neuron/context-engine';
import type { NeuronSupabaseClient } from '../client.js';

function rowToMemory(row: {
  id: string;
  project_id: string;
  type: string;
  layer: string;
  title: string;
  content: string;
  summary: string | null;
  status: string;
  confidence: number;
  importance: number;
  access_count: number;
  last_accessed_at: string | null;
  expires_at: string | null;
  source_type: string;
  source_ref_id: string | null;
  source_actor_id: string | null;
  metadata: Record<string, unknown>;
  tags: string[];
  created_at: string;
  updated_at: string;
}): Memory {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type as Memory['type'],
    layer: contextLayerFromDb(row.layer),
    title: row.title,
    content: row.content,
    summary: row.summary,
    status: row.status as Memory['status'],
    confidence: row.confidence,
    importance: row.importance,
    accessCount: row.access_count,
    lastAccessedAt: row.last_accessed_at,
    expiresAt: row.expires_at,
    source: {
      type: row.source_type as Memory['source']['type'],
      referenceId: row.source_ref_id ?? undefined,
      actorId: row.source_actor_id ?? undefined,
    },
    metadata: row.metadata ?? {},
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createMemoryRepository(client: NeuronSupabaseClient): MemoryRepository {
  return {
    async create(input: RememberInput) {
      const { data, error } = await client
        .from('memories')
        .insert({
          project_id: input.projectId,
          type: input.type,
          layer: contextLayerToDb(input.layer ?? ContextLayer.Project),
          title: input.title,
          content: input.content,
          confidence: input.confidence ?? 0.8,
          importance: input.importance ?? 0.5,
          source_type: input.source?.type ?? 'manual',
          source_ref_id: input.source?.referenceId ?? null,
          source_actor_id: input.source?.actorId ?? null,
          metadata: input.metadata ?? {},
          tags: input.tags ?? [],
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return rowToMemory(data);
    },

    async findById(id) {
      const { data, error } = await client
        .from('memories')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data ? rowToMemory(data) : null;
    },

    async findByProject(projectId, filters?: MemoryFilters) {
      let query = client.from('memories').select('*').eq('project_id', projectId);

      if (filters?.types?.length) query = query.in('type', filters.types);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.layer) query = query.eq('layer', contextLayerToDb(filters.layer));
      if (filters?.limit) query = query.limit(filters.limit);
      if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);

      query = query.order('updated_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []).map(rowToMemory);
    },

    async update(id, data) {
      const patch: Record<string, unknown> = {};
      if (data.title) patch.title = data.title;
      if (data.content) patch.content = data.content;
      if (data.summary !== undefined) patch.summary = data.summary;
      if (data.tags) patch.tags = data.tags;
      if (data.status) patch.status = data.status;
      if (data.confidence !== undefined) patch.confidence = data.confidence;
      if (data.metadata) patch.metadata = data.metadata;

      const { data: row, error } = await client
        .from('memories')
        .update(patch)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return rowToMemory(row);
    },

    async forget({ memoryId }: ForgetMemoryInput) {
      const { error } = await client
        .from('memories')
        .update({ status: MemoryStatus.Forgotten })
        .eq('id', memoryId);

      if (error) throw new Error(error.message);
    },

    async merge({ sourceMemoryId, targetMemoryId, mergedTitle, mergedContent }: MergeMemoryInput) {
      const target = await this.findById(targetMemoryId);
      const source = await this.findById(sourceMemoryId);
      if (!target || !source) throw new Error('Memory not found for merge');

      const { data, error } = await client
        .from('memories')
        .update({
          title: mergedTitle ?? target.title,
          content: mergedContent ?? `${target.content}\n${source.content}`,
          confidence: Math.max(source.confidence, target.confidence),
          status: MemoryStatus.Active,
        })
        .eq('id', targetMemoryId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      await client
        .from('memories')
        .update({ status: MemoryStatus.Merged })
        .eq('id', sourceMemoryId);

      return rowToMemory(data);
    },

    async search(input: SearchMemoryInput): Promise<SearchMemoryResult> {
      const { data, error } = await client
        .from('memories')
        .select('*')
        .eq('project_id', input.projectId)
        .eq('status', MemoryStatus.Active)
        .or(`title.ilike.%${input.query}%,content.ilike.%${input.query}%`)
        .limit(input.limit ?? 20);

      if (error) throw new Error(error.message);

      const results = (data ?? []).map((row) => ({
        memory: rowToMemory(row),
        score: 0.5,
        scoreBreakdown: {
          semanticSimilarity: 0,
          keywordMatch: 0.5,
          graphProximity: 0,
          recency: 0.5,
          importance: row.importance,
          layerPriority: 0.5,
          confidence: row.confidence,
          composite: 0.5,
        },
      }));

      return { results, totalCount: results.length, query: input.query };
    },

    async incrementAccess(id) {
      const memory = await this.findById(id);
      if (!memory) return;

      await client
        .from('memories')
        .update({
          access_count: memory.accessCount + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', id);
    },
  };
}
