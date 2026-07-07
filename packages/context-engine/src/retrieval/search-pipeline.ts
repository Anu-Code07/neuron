import type { Memory, ScoredMemory } from '@neuron/shared';

export const WEAK_SEARCH_THRESHOLD = 0.38;

export function isWeakSearchResult(results: ScoredMemory[]): boolean {
  if (!results.length) return true;
  const top = results[0];
  return (
    top.score < WEAK_SEARCH_THRESHOLD ||
    (top.scoreBreakdown.keywordMatch < 0.15 &&
      top.scoreBreakdown.semanticSimilarity < 0.25)
  );
}

export function mergeSemanticScores(
  ...maps: Array<Map<string, number>>
): Map<string, number> {
  const merged = new Map<string, number>();
  for (const map of maps) {
    for (const [id, score] of map) {
      merged.set(id, Math.max(merged.get(id) ?? 0, score));
    }
  }
  return merged;
}

/** Inject title-sweep hits into the ranked pool before LLM rerank */
export function applyTitleSweepBoost(
  ranked: ScoredMemory[],
  allMemories: Memory[],
  sweptIds: string[],
  boostScore = 0.75,
): ScoredMemory[] {
  if (!sweptIds.length) return ranked;

  const byId = new Map(ranked.map((r) => [r.memory.id, r]));

  for (const id of sweptIds) {
    const existing = byId.get(id);
    if (existing) {
      const score = Math.max(existing.score, boostScore);
      byId.set(id, {
        ...existing,
        score,
        scoreBreakdown: { ...existing.scoreBreakdown, composite: score },
      });
      continue;
    }

    const memory = allMemories.find((m) => m.id === id);
    if (!memory) continue;

    byId.set(id, {
      memory,
      score: boostScore,
      scoreBreakdown: {
        semanticSimilarity: 0,
        keywordMatch: 0.6,
        graphProximity: 0,
        recency: 0.5,
        importance: memory.importance,
        layerPriority: 0.5,
        confidence: memory.confidence,
        composite: boostScore,
      },
    });
  }

  return [...byId.values()].sort((a, b) => b.score - a.score);
}
