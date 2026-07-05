import type { LlmProvider } from './llm-provider.js';
import type { Memory } from '@neuron/shared';
import type { ScoredMemory } from '@neuron/shared';

/** Groq LLM reranking when vector embeddings are unavailable */
export async function rerankMemoriesWithLlm(
  llm: LlmProvider,
  query: string,
  memories: Memory[],
  limit: number,
): Promise<ScoredMemory[]> {
  if (!memories.length) return [];

  const listing = memories
    .slice(0, 30)
    .map((m, i) => `[${i}] ${m.title}: ${(m.summary ?? m.content).slice(0, 120)}`)
    .join('\n');

  const raw = await llm.chat(
    [
      {
        role: 'system',
        content:
          'Rank memory indices by relevance to the query. Reply with JSON: {"ranked":[0,2,1,...]} using only indices from the list.',
      },
      { role: 'user', content: `Query: ${query}\n\nMemories:\n${listing}` },
    ],
    { maxTokens: 120, temperature: 0 },
  );

  try {
    const parsed = JSON.parse(raw) as { ranked?: number[] };
    const ranked = parsed.ranked ?? [];
    return ranked
      .filter((i) => i >= 0 && i < memories.length)
      .slice(0, limit)
      .map((i, rank) => ({
        memory: memories[i],
        score: 1 - rank * 0.05,
        scoreBreakdown: {
          semanticSimilarity: 0.8,
          keywordMatch: 0.5,
          graphProximity: 0,
          recency: 0.5,
          importance: memories[i].importance,
          layerPriority: 0.5,
          confidence: memories[i].confidence,
          composite: 1 - rank * 0.05,
        },
      }));
  } catch {
    return memories.slice(0, limit).map((m) => ({
      memory: m,
      score: 0.5,
      scoreBreakdown: {
        semanticSimilarity: 0,
        keywordMatch: 0.5,
        graphProximity: 0,
        recency: 0.5,
        importance: m.importance,
        layerPriority: 0.5,
        confidence: m.confidence,
        composite: 0.5,
      },
    }));
  }
}
