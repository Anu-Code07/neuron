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
