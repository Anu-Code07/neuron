import type { EmbeddingProvider } from '../domain/repositories.js';

const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`;
export const EMBEDDING_DIMENSIONS = 384;

/** Mean-pool token vectors from HF feature-extraction output */
function meanPool(vectors: number[][]): number[] {
  if (!vectors.length) throw new Error('Empty embedding response');
  const dims = vectors[0].length;
  const pooled = new Array<number>(dims).fill(0);
  for (const vec of vectors) {
    for (let i = 0; i < dims; i++) pooled[i] += vec[i];
  }
  return pooled.map((v) => v / vectors.length);
}

function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return vector;
  return vector.map((v) => v / norm);
}

export function createHuggingFaceEmbeddingProvider(apiKey?: string): EmbeddingProvider {
  const key = apiKey ?? process.env.HUGGINGFACE_API_KEY;

  return {
    model: HF_MODEL,
    async embed(text) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (key) headers.Authorization = `Bearer ${key}`;

      const res = await fetch(HF_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ inputs: text.slice(0, 8000) }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HuggingFace embedding error (${res.status}): ${body}`);
      }

      const raw = (await res.json()) as number[] | number[][];
      const tokenVectors = Array.isArray(raw[0]) ? (raw as number[][]) : [raw as number[]];
      return normalize(meanPool(tokenVectors));
    },
  };
}
