import type { ContextEngineDeps } from '@neuron/context-engine';
import { createNeuronClient, createServiceClient } from './client.js';
import { createMemoryRepository } from './repositories/memory.repository.js';
import { createRelationshipRepository } from './repositories/relationship.repository.js';
import {
  createEmbeddingRepository,
  createProjectRepository,
} from './repositories/project.repository.js';

export function createContextEngineDeps(useServiceRole = false): ContextEngineDeps {
  const client = useServiceRole ? createServiceClient() : createNeuronClient();

  return {
    memories: createMemoryRepository(client),
    relationships: createRelationshipRepository(client),
    embeddings: createEmbeddingRepository(client),
    projects: createProjectRepository(client),
  };
}

export { createNeuronClient, createServiceClient, getSupabaseConfig } from './client.js';
export type { NeuronSupabaseClient } from './client.js';
