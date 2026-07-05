import type { EmbeddingRepository, ProjectRepository } from '@neuron/context-engine';
import type { NeuronSupabaseClient } from '../client.js';

export function createProjectRepository(client: NeuronSupabaseClient): ProjectRepository {
  return {
    async findById(id) {
      const { data, error } = await client
        .from('projects')
        .select('id, name, slug, tech_stack, description')
        .eq('id', id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        techStack: data.tech_stack ?? [],
        description: data.description,
      };
    },
  };
}

export function createEmbeddingRepository(
  client: NeuronSupabaseClient,
): EmbeddingRepository {
  return {
    async create(memoryId, projectId, vector, model) {
      const { error } = await client.from('embeddings' as 'memories').insert({
        memory_id: memoryId,
        project_id: projectId,
        embedding: JSON.stringify(vector),
        model,
      } as never);
      if (error) {
        // embeddings table may not exist until migration runs
        console.warn('Embedding insert skipped:', error.message);
      }
    },

    async search(_projectId, _vector, _limit) {
      // Vector search requires pgvector RPC — Phase 4
      return [];
    },
  };
}
