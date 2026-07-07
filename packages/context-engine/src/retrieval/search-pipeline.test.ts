import { describe, expect, it } from 'vitest';
import { applyTitleSweepBoost, isWeakSearchResult, mergeSemanticScores } from './search-pipeline.js';
import type { Memory } from '@neuron/shared';

function makeMemory(id: string, title: string): Memory {
  return {
    id,
    projectId: 'p1',
    type: 'fact',
    layer: 'project',
    title,
    content: title,
    summary: null,
    status: 'active',
    confidence: 0.8,
    importance: 0.5,
    accessCount: 0,
    lastAccessedAt: null,
    expiresAt: null,
    source: { type: 'manual' },
    metadata: {},
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('search-pipeline', () => {
  it('merges semantic scores by max', () => {
    const a = new Map([['m1', 0.4]]);
    const b = new Map([['m1', 0.7], ['m2', 0.5]]);
    const merged = mergeSemanticScores(a, b);
    expect(merged.get('m1')).toBe(0.7);
    expect(merged.get('m2')).toBe(0.5);
  });

  it('detects weak search results', () => {
    expect(isWeakSearchResult([])).toBe(true);
    expect(
      isWeakSearchResult([
        {
          memory: makeMemory('m1', 'x'),
          score: 0.2,
          scoreBreakdown: {
            semanticSimilarity: 0.1,
            keywordMatch: 0.1,
            graphProximity: 0,
            recency: 0.5,
            importance: 0.5,
            layerPriority: 0.5,
            confidence: 0.8,
            composite: 0.2,
          },
        },
      ]),
    ).toBe(true);
  });

  it('boosts title-sweep ids into results', () => {
    const memories = [makeMemory('a', 'A'), makeMemory('b', 'B')];
    const ranked = [
      {
        memory: memories[0],
        score: 0.3,
        scoreBreakdown: {
          semanticSimilarity: 0,
          keywordMatch: 0.3,
          graphProximity: 0,
          recency: 0.5,
          importance: 0.5,
          layerPriority: 0.5,
          confidence: 0.8,
          composite: 0.3,
        },
      },
    ];
    const boosted = applyTitleSweepBoost(ranked, memories, ['b']);
    expect(boosted[0].memory.id).toBe('b');
  });
});
