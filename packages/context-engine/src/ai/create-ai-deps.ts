import type { ContextEngineDeps, EmbeddingProvider } from '../domain/repositories.js';
import { createGroqClient } from './groq-client.js';
import { createHuggingFaceEmbeddingProvider } from './huggingface-embeddings.js';
import { createLocalEmbeddingProvider } from './local-embeddings.js';

function resolveEmbeddingProvider(): EmbeddingProvider | undefined {
  const mode = (process.env.NEURON_EMBEDDINGS ?? 'local').toLowerCase();

  if (mode === 'off' || mode === 'false' || mode === '0') {
    return undefined;
  }

  if (mode === 'huggingface' || mode === 'hf') {
    return createHuggingFaceEmbeddingProvider();
  }

  return createLocalEmbeddingProvider();
}

export function createAiDeps(): Pick<ContextEngineDeps, 'llm' | 'embeddingProvider'> {
  return {
    llm: createGroqClient(),
    embeddingProvider: resolveEmbeddingProvider(),
  };
}

export { createGroqClient } from './groq-client.js';
export { createLocalEmbeddingProvider } from './local-embeddings.js';
