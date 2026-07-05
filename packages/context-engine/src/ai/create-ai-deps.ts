import type { ContextEngineDeps } from '../domain/repositories.js';
import { createGroqClient } from './groq-client.js';

export function createAiDeps(): Pick<ContextEngineDeps, 'llm' | 'embeddingProvider'> {
  const llm = createGroqClient();
  return { llm, embeddingProvider: undefined };
}

export { createGroqClient } from './groq-client.js';
