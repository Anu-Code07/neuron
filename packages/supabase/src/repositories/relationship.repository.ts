import type { RelationshipRepository } from '@neuron/context-engine';
import type { NeuronSupabaseClient } from '../client.js';

export function createRelationshipRepository(
  client: NeuronSupabaseClient,
): RelationshipRepository {
  return {
    async create(projectId, sourceId, targetId, type) {
      const { error } = await client.from('relationships').insert({
        project_id: projectId,
        source_memory_id: sourceId,
        target_memory_id: targetId,
        type,
      });
      if (error) throw new Error(error.message);
    },

    async findByMemory(memoryId) {
      const { data, error } = await client
        .from('relationships')
        .select('target_memory_id, type')
        .eq('source_memory_id', memoryId);

      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => ({
        targetMemoryId: r.target_memory_id,
        type: r.type,
      }));
    },

    async findRelated(memoryIds, depth = 2) {
      const found = new Set<string>();
      let current = [...memoryIds];

      for (let d = 0; d < depth; d++) {
        const next: string[] = [];

        for (const id of current) {
          const { data: outgoing } = await client
            .from('relationships')
            .select('target_memory_id, source_memory_id')
            .or(`source_memory_id.eq.${id},target_memory_id.eq.${id}`);

          for (const r of outgoing ?? []) {
            const other =
              r.source_memory_id === id ? r.target_memory_id : r.source_memory_id;
            if (!found.has(other) && !memoryIds.includes(other)) {
              found.add(other);
              next.push(other);
            }
          }
        }
        current = next;
      }

      return [...found];
    },
  };
}
