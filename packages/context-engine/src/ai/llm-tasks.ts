import type { LlmProvider } from './llm-provider.js';

export async function summarizeMemoriesWithLlm(
  llm: LlmProvider,
  rawSummary: string,
  projectName?: string,
): Promise<string> {
  if (!rawSummary.trim()) return 'No project memories stored yet.';

  return llm.chat(
    [
      {
        role: 'system',
        content:
          'You summarize software project knowledge for AI coding assistants. Be concise, structured, and actionable. Use markdown headings and bullet points.',
      },
      {
        role: 'user',
        content: `Project: ${projectName ?? 'Unknown'}\n\nRaw memory notes:\n${rawSummary}\n\nWrite a compact project brief a developer can paste into an AI assistant.`,
      },
    ],
    { maxTokens: 800, temperature: 0.2 },
  );
}

export async function enhanceContextNarrative(
  llm: LlmProvider,
  query: string,
  memorySnippets: string[],
): Promise<string> {
  if (!memorySnippets.length) return '';

  return llm.chat(
    [
      {
        role: 'system',
        content:
          'You synthesize project context for an AI coding session. Focus only on facts from the snippets. Max 150 words.',
      },
      {
        role: 'user',
        content: `Task/query: ${query}\n\nRelevant memories:\n${memorySnippets.join('\n---\n')}\n\nWrite a focused context paragraph.`,
      },
    ],
    { maxTokens: 300, temperature: 0.2 },
  );
}

export async function generateMemorySummary(
  llm: LlmProvider,
  title: string,
  content: string,
): Promise<string> {
  return llm.chat(
    [
      {
        role: 'system',
        content: 'Write a one-sentence summary (max 25 words) of this project memory.',
      },
      {
        role: 'user',
        content: `Title: ${title}\nContent: ${content.slice(0, 2000)}`,
      },
    ],
    { maxTokens: 60, temperature: 0.1 },
  );
}

export async function suggestMemoryTags(
  llm: LlmProvider,
  title: string,
  content: string,
): Promise<string[]> {
  const raw = await llm.chat(
    [
      {
        role: 'system',
        content: 'Return 3-5 lowercase tags for this memory as a JSON array of strings. No markdown.',
      },
      {
        role: 'user',
        content: `Title: ${title}\nContent: ${content.slice(0, 1500)}`,
      },
    ],
    { maxTokens: 80, temperature: 0.1 },
  );

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((t): t is string => typeof t === 'string').slice(0, 5);
    }
  } catch {
    /* fallback below */
  }
  return [];
}

export interface DuplicateCandidate {
  memoryId: string;
  similarity: number;
  reason: string;
}

export async function findDuplicateCandidates(
  llm: LlmProvider,
  focus: { id: string; title: string; content: string },
  candidates: Array<{ id: string; title: string; content: string }>,
): Promise<DuplicateCandidate[]> {
  const others = candidates.filter((c) => c.id !== focus.id).slice(0, 20);
  if (!others.length) return [];

  const raw = await llm.chat(
    [
      {
        role: 'system',
        content:
          'Find likely duplicate project memories. Return JSON array: [{ "memoryId": "uuid", "similarity": 0.0-1.0, "reason": "brief" }]. Only include pairs with similarity >= 0.5. No markdown.',
      },
      {
        role: 'user',
        content: `Focus memory:\n${focus.title}\n${focus.content.slice(0, 800)}\n\nCandidates:\n${others.map((c) => `[${c.id}] ${c.title}: ${c.content.slice(0, 200)}`).join('\n')}`,
      },
    ],
    { maxTokens: 400, temperature: 0.1 },
  );

  try {
    const parsed = JSON.parse(raw) as DuplicateCandidate[];
    if (Array.isArray(parsed)) return parsed.filter((d) => d.memoryId && d.similarity >= 0.5);
  } catch {
    /* no duplicates detected */
  }
  return [];
}

export interface ExtractedMemoryDraft {
  type: string;
  title: string;
  content: string;
  tags?: string[];
}

export async function answerFromMemories(
  llm: LlmProvider,
  question: string,
  memories: Array<{ id: string; title: string; content: string; type: string }>,
): Promise<string> {
  if (!memories.length) {
    return 'No relevant memories found for this question.';
  }

  const snippets = memories
    .map((m) => `[${m.id}] (${m.type}) ${m.title}: ${m.content.slice(0, 400)}`)
    .join('\n---\n');

  return llm.chat(
    [
      {
        role: 'system',
        content:
          'Answer the developer question using ONLY the project memories below. If memories are insufficient, say so briefly. Cite memory titles when helpful. Max 250 words.',
      },
      {
        role: 'user',
        content: `Question: ${question}\n\nMemories:\n${snippets}`,
      },
    ],
    { maxTokens: 400, temperature: 0.2 },
  );
}

export async function extractMemoriesFromText(
  llm: LlmProvider,
  conversation: string,
): Promise<ExtractedMemoryDraft[]> {
  const raw = await llm.chat(
    [
      {
        role: 'system',
        content:
          'Extract durable project facts from a dev conversation. Return JSON array: [{ "type": "fact|decision|pattern|bug|task", "title": "...", "content": "...", "tags": [] }]. Max 5 items. No markdown.',
      },
      {
        role: 'user',
        content: conversation.slice(0, 8000),
      },
    ],
    { maxTokens: 800, temperature: 0.2 },
  );

  try {
    const parsed = JSON.parse(raw) as ExtractedMemoryDraft[];
    if (Array.isArray(parsed)) {
      return parsed.filter((d) => d.title && d.content).slice(0, 5);
    }
  } catch {
    /* extraction failed */
  }
  return [];
}

export interface CondensedMemoryDraft {
  type: string;
  title: string;
  content: string;
  tags?: string[];
}

export async function condenseMemoriesWithLlm(
  llm: LlmProvider,
  memories: Array<{ id: string; title: string; content: string; type: string }>,
): Promise<CondensedMemoryDraft> {
  const combined = memories
    .map((m) => `[${m.id}] (${m.type}) ${m.title}:\n${m.content.slice(0, 600)}`)
    .join('\n---\n');

  const raw = await llm.chat(
    [
      {
        role: 'system',
        content:
          'Merge overlapping project memories into one concise memory. Return JSON: { "type": "fact|decision|pattern|note", "title": "...", "content": "...", "tags": [] }. No markdown.',
      },
      {
        role: 'user',
        content: `Memories to merge:\n${combined}`,
      },
    ],
    { maxTokens: 600, temperature: 0.2 },
  );

  try {
    const parsed = JSON.parse(raw) as CondensedMemoryDraft;
    if (parsed.title && parsed.content) return parsed;
  } catch {
    /* fallback below */
  }

  return {
    type: 'note',
    title: memories[0]?.title ?? 'Condensed memory',
    content: memories.map((m) => m.content).join('\n\n'),
    tags: [],
  };
}

export interface SuggestedRelationship {
  targetMemoryId: string;
  type: string;
  reason: string;
}

export async function suggestRelationshipEdges(
  llm: LlmProvider,
  focus: { id: string; title: string; content: string; type: string },
  candidates: Array<{ id: string; title: string; content: string; type: string }>,
  existingTargets: string[],
): Promise<SuggestedRelationship[]> {
  const available = candidates.filter((c) => c.id !== focus.id && !existingTargets.includes(c.id));
  if (!available.length) return [];

  const raw = await llm.chat(
    [
      {
        role: 'system',
        content:
          'Suggest knowledge graph edges between a focus memory and candidates. Return JSON array: [{ "targetMemoryId": "uuid", "type": "uses|references|depends_on|implements|supersedes|related_to|calls|contains|blocks|fixes", "reason": "brief" }]. Max 5. Only strong links. No markdown.',
      },
      {
        role: 'user',
        content: `Focus [${focus.id}] (${focus.type}) ${focus.title}: ${focus.content.slice(0, 400)}\n\nCandidates:\n${available.map((c) => `[${c.id}] (${c.type}) ${c.title}: ${c.content.slice(0, 150)}`).join('\n')}`,
      },
    ],
    { maxTokens: 400, temperature: 0.1 },
  );

  try {
    const parsed = JSON.parse(raw) as SuggestedRelationship[];
    if (Array.isArray(parsed)) {
      const validIds = new Set(available.map((c) => c.id));
      return parsed.filter((r) => validIds.has(r.targetMemoryId)).slice(0, 5);
    }
  } catch {
    /* no suggestions */
  }
  return [];
}

export async function extractMemoriesFromDiff(
  llm: LlmProvider,
  diff: string,
): Promise<ExtractedMemoryDraft[]> {
  const raw = await llm.chat(
    [
      {
        role: 'system',
        content:
          'Extract durable project learnings from a git diff. Return JSON array: [{ "type": "fact|decision|pattern|bug|component|file", "title": "...", "content": "...", "tags": [] }]. Max 5 items. Skip trivial formatting. No markdown.',
      },
      {
        role: 'user',
        content: diff.slice(0, 12000),
      },
    ],
    { maxTokens: 800, temperature: 0.2 },
  );

  try {
    const parsed = JSON.parse(raw) as ExtractedMemoryDraft[];
    if (Array.isArray(parsed)) {
      return parsed.filter((d) => d.title && d.content).slice(0, 5);
    }
  } catch {
    /* extraction failed */
  }
  return [];
}
