import { describe, it, expect } from 'vitest';
import {
  extractKeywords,
  scoreMemory,
  rankMemories,
  estimateTokens,
} from '../src/retrieval/scorer.js';
import { ContextLayer, MemoryType, MemoryStatus } from '@neuron/shared';
import type { Memory } from '@neuron/shared';

function makeMemory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: 'mem-1',
    projectId: 'proj-1',
    type: MemoryType.Decision,
    layer: ContextLayer.Project,
    title: 'Authentication Provider',
    content: 'We chose Supabase Auth for authentication',
    summary: 'Supabase Auth selected',
    status: MemoryStatus.Active,
    confidence: 0.9,
    importance: 0.8,
    accessCount: 5,
    lastAccessedAt: new Date().toISOString(),
    expiresAt: null,
    source: { type: 'conversation' },
    metadata: { chosen: 'Supabase Auth', reason: 'Pricing' },
    tags: ['auth', 'supabase'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('extractKeywords', () => {
  it('removes stop words and short tokens', () => {
    const keywords = extractKeywords('How is authentication implemented in the project?');
    expect(keywords).toContain('authentication');
    expect(keywords).toContain('implemented');
    expect(keywords).toContain('project');
    expect(keywords).not.toContain('how');
    expect(keywords).not.toContain('is');
  });
});

describe('scoreMemory', () => {
  it('scores higher when keywords match', () => {
    const memory = makeMemory();
    const signals = {
      queryKeywords: ['authentication', 'supabase'],
      seedMemoryIds: [],
      relatedMemoryIds: [],
      openFiles: [],
    };

    const scored = scoreMemory(memory, signals, 0.8);
    expect(scored.score).toBeGreaterThan(0);
    expect(scored.scoreBreakdown.keywordMatch).toBeGreaterThan(0);
    expect(scored.scoreBreakdown.semanticSimilarity).toBe(0.8);
  });

  it('boosts seed memories via graph proximity', () => {
    const memory = makeMemory({ id: 'seed-1' });
    const signals = {
      queryKeywords: [],
      seedMemoryIds: ['seed-1'],
      relatedMemoryIds: [],
      openFiles: [],
    };

    const scored = scoreMemory(memory, signals);
    expect(scored.scoreBreakdown.graphProximity).toBe(1.0);
  });
});

describe('rankMemories', () => {
  it('sorts by composite score descending', () => {
    const high = makeMemory({ id: 'high', importance: 0.95, confidence: 0.95 });
    const low = makeMemory({ id: 'low', importance: 0.1, confidence: 0.3, title: 'Unrelated topic' });

    const ranked = rankMemories([low, high], {
      queryKeywords: ['authentication'],
      seedMemoryIds: [],
      relatedMemoryIds: [],
      openFiles: [],
    });

    expect(ranked[0].memory.id).toBe('high');
  });
});

describe('estimateTokens', () => {
  it('estimates ~4 chars per token', () => {
    expect(estimateTokens('hello world')).toBe(3);
    expect(estimateTokens('a'.repeat(400))).toBe(100);
  });
});
