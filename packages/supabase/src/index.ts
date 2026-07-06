import type { ContextEngineDeps } from '@neuron/context-engine';
import { createAiDeps } from '@neuron/context-engine';
import { createNeuronClient, createServiceClient } from './client.js';
import { createMemoryRepository } from './repositories/memory.repository.js';
import { createRelationshipRepository } from './repositories/relationship.repository.js';
import {
  createEmbeddingRepository,
  createProjectRepository,
} from './repositories/project.repository.js';
import {
  createProjectLinkRepository,
  createWorkspaceRepoRepository,
} from './repositories/workspace.repository.js';

export function createContextEngineDeps(useServiceRole = false): ContextEngineDeps {
  const client = useServiceRole ? createServiceClient() : createNeuronClient();

  return {
    memories: createMemoryRepository(client),
    relationships: createRelationshipRepository(client),
    embeddings: createEmbeddingRepository(client),
    projects: createProjectRepository(client),
    projectLinks: createProjectLinkRepository(client),
    workspaceRepos: createWorkspaceRepoRepository(client),
    ...createAiDeps(),
  };
}

export {
  createProjectLinkRepository,
  createWorkspaceRepoRepository,
} from './repositories/workspace.repository.js';
export type {
  ProjectLinkRepository,
  WorkspaceRepoRepository,
} from './repositories/workspace.repository.js';

export { createNeuronClient, createServiceClient, getSupabaseConfig } from './client.js';
export type { NeuronSupabaseClient } from './client.js';
