import type { EmbeddingProvider } from '../domain/repositories.js';
import { EMBEDDING_DIMENSIONS, LOCAL_EMBEDDING_MODEL } from './embedding-constants.js';

type FeatureExtractor = (
  text: string,
  options: { pooling: 'mean'; normalize: boolean },
) => Promise<{ data: Float32Array }>;

let extractorPromise: Promise<FeatureExtractor> | null = null;

async function loadExtractor(): Promise<FeatureExtractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline } = await import('@xenova/transformers');
      return pipeline('feature-extraction', LOCAL_EMBEDDING_MODEL) as Promise<FeatureExtractor>;
    })();
  }
  return extractorPromise;
}

/** In-process embeddings — no external API key; model cached after first load */
export function createLocalEmbeddingProvider(): EmbeddingProvider {
  return {
    model: LOCAL_EMBEDDING_MODEL,
    async embed(text) {
      const extractor = await loadExtractor();
      const output = await extractor(text.slice(0, 8000), {
        pooling: 'mean',
        normalize: true,
      });
      const vector = Array.from(output.data);
      if (vector.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(`Expected ${EMBEDDING_DIMENSIONS} dims, got ${vector.length}`);
      }
      return vector;
    },
  };
}
