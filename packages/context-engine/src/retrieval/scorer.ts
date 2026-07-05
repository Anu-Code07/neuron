import {
  LAYER_PRIORITY,
  MEMORY_RETRIEVAL_WEIGHT,
  type ContextLayer,
  type Memory,
  type ScoredMemory,
  type ScoreBreakdown,
} from '@neuron/shared';

export interface RetrievalSignals {
  queryVector?: number[];
  queryKeywords: string[];
  seedMemoryIds: string[];
  relatedMemoryIds: string[];
  openFiles: string[];
  branchName?: string;
  layerFilter?: ContextLayer[];
}

const WEIGHTS = {
  semanticSimilarity: 0.35,
  keywordMatch: 0.2,
  graphProximity: 0.15,
  recency: 0.15,
  importance: 0.1,
  layerPriority: 0.05,
} as const;

export function scoreMemory(
  memory: Memory,
  signals: RetrievalSignals,
  semanticSimilarity = 0,
): ScoredMemory {
  const keywordMatch = computeKeywordMatch(memory, signals.queryKeywords);
  const graphProximity = computeGraphProximity(memory.id, signals);
  const recency = computeRecency(memory.updatedAt);
  const importance = memory.importance;
  const layerPriority = LAYER_PRIORITY[memory.layer as ContextLayer] ?? 0.5;
  const typeWeight = MEMORY_RETRIEVAL_WEIGHT[memory.type as keyof typeof MEMORY_RETRIEVAL_WEIGHT] ?? 0.5;

  const breakdown: ScoreBreakdown = {
    semanticSimilarity,
    keywordMatch,
    graphProximity,
    recency,
    importance,
    layerPriority,
    confidence: memory.confidence,
    composite: 0,
  };

  breakdown.composite =
    (breakdown.semanticSimilarity * WEIGHTS.semanticSimilarity +
      breakdown.keywordMatch * WEIGHTS.keywordMatch +
      breakdown.graphProximity * WEIGHTS.graphProximity +
      breakdown.recency * WEIGHTS.recency +
      breakdown.importance * WEIGHTS.importance +
      breakdown.layerPriority * WEIGHTS.layerPriority) *
    breakdown.confidence *
    typeWeight;

  return { memory, score: breakdown.composite, scoreBreakdown: breakdown };
}

function computeKeywordMatch(memory: Memory, keywords: string[]): number {
  if (keywords.length === 0) return 0;

  const haystack = `${memory.title} ${memory.content} ${memory.summary ?? ''} ${memory.tags.join(' ')}`.toLowerCase();
  const matches = keywords.filter((kw) => haystack.includes(kw.toLowerCase()));
  return matches.length / keywords.length;
}

function computeGraphProximity(memoryId: string, signals: RetrievalSignals): number {
  if (signals.seedMemoryIds.includes(memoryId)) return 1.0;
  if (signals.relatedMemoryIds.includes(memoryId)) return 0.7;
  return 0;
}

function computeRecency(updatedAt: string): number {
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - ageDays / 90);
}

export function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .filter((w) => !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'will', 'with',
  'this', 'that', 'from', 'they', 'what', 'how', 'does', 'where', 'when',
]);

export function rankMemories(
  memories: Memory[],
  signals: RetrievalSignals,
  semanticScores?: Map<string, number>,
): ScoredMemory[] {
  return memories
    .map((m) => scoreMemory(m, signals, semanticScores?.get(m.id) ?? 0))
    .sort((a, b) => b.score - a.score);
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function truncateToTokenBudget<T>(
  items: T[],
  budget: number,
  serialize: (item: T) => string,
): T[] {
  const result: T[] = [];
  let used = 0;

  for (const item of items) {
    const tokens = estimateTokens(serialize(item));
    if (used + tokens > budget) break;
    result.push(item);
    used += tokens;
  }

  return result;
}
