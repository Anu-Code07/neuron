import { describe, expect, it } from 'vitest';
import { rewriteSearchQuery } from './llm-tasks.js';
import type { LlmProvider } from './llm-provider.js';

function mockLlm(response: string): LlmProvider {
  return {
    model: 'test',
    chat: async () => response,
  };
}

describe('rewriteSearchQuery', () => {
  it('parses Groq JSON rewrite', async () => {
    const result = await rewriteSearchQuery(
      mockLlm(
        JSON.stringify({
          searchQuery: 'bus yellow strip UI bug',
          types: ['bug'],
          extraKeywords: ['warning banner', 'route list'],
        }),
      ),
      'Get the bus yellow strip bug from Neuron',
    );

    expect(result.searchQuery).toBe('bus yellow strip UI bug');
    expect(result.types).toEqual(['bug']);
    expect(result.extraKeywords).toEqual(['warning banner', 'route list']);
  });

  it('falls back to raw query on invalid JSON', async () => {
    const result = await rewriteSearchQuery(mockLlm('not json'), 'bus yellow strip');
    expect(result.searchQuery).toBe('bus yellow strip');
  });
});
