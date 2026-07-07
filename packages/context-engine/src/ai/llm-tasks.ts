import type { LlmProvider } from './llm-provider.js';

export interface RewrittenSearchQuery {
  searchQuery: string;
  intent?: 'find_memory' | 'answer_question' | 'load_context' | 'unknown';
  types?: string[];
  extraKeywords?: string[];
}

/** Turn conversational queries into focused search terms (Groq) */
export async function rewriteSearchQuery(
  llm: LlmProvider,
  rawQuery: string,
): Promise<RewrittenSearchQuery> {
  const raw = await llm.chat(
    [
      {
        role: 'system',
        content:
          'Rewrite developer memory search queries. Return JSON only: { "searchQuery": "focused terms", "intent": "find_memory", "types": ["bug"], "extraKeywords": ["synonym"] }. intent: find_memory|answer_question|load_context|unknown. types optional: bug|decision|fact|pattern|task|component|api|file|architecture|database|note. Strip filler like "get", "from Neuron", "tell me". extraKeywords: 0-4 synonyms.',
      },
      { role: 'user', content: rawQuery.slice(0, 500) },
    ],
    { maxTokens: 140, temperature: 0 },
  );

  try {
    const parsed = JSON.parse(raw) as RewrittenSearchQuery;
    if (parsed.searchQuery?.trim()) {
      return {
        searchQuery: parsed.searchQuery.trim(),
        intent: parsed.intent,
        types: parsed.types?.filter((t) => typeof t === 'string').slice(0, 3),
        extraKeywords: parsed.extraKeywords?.filter((k) => typeof k === 'string').slice(0, 4),
      };
    }
  } catch {
    /* use raw query */
  }

  return { searchQuery: rawQuery.trim(), intent: 'unknown' };
}

/** HyDE: hypothetical memory text for semantic embedding */
export async function generateHypotheticalMemory(
  llm: LlmProvider,
  rawQuery: string,
  rewrittenQuery: string,
): Promise<string> {
  return llm.chat(
    [
      {
        role: 'system',
        content:
          'Write a hypothetical project memory (2-3 sentences) that would match this search. Write as a bug report, decision, or fact — no preamble.',
      },
      { role: 'user', content: `Query: ${rawQuery}\nFocus: ${rewrittenQuery}` },
    ],
    { maxTokens: 150, temperature: 0.3 },
  );
}

/** Groq title sweep — pick memories by title/summary when keyword search is weak */
export async function titleSweepMemories(
  llm: LlmProvider,
  query: string,
  candidates: Array<{ id: string; title: string; summary?: string | null }>,
  maxResults = 15,
): Promise<string[]> {
  if (!candidates.length) return [];

  const indexed = candidates.slice(0, 80);
  const listing = indexed
    .map((m, i) => `[${i}] ${m.title}: ${(m.summary ?? '').slice(0, 100)}`)
    .join('\n');

  const raw = await llm.chat(
    [
      {
        role: 'system',
        content: `Pick memory indices relevant to the query. Return JSON: {"matches":[0,2,...]} max ${maxResults}. Only strong matches.`,
      },
      { role: 'user', content: `Query: ${query}\n\nMemories:\n${listing}` },
    ],
    { maxTokens: 150, temperature: 0 },
  );

  try {
    const parsed = JSON.parse(raw) as { matches?: number[] };
    const matches = parsed.matches ?? [];
    return matches
      .filter((i) => i >= 0 && i < indexed.length)
      .slice(0, maxResults)
      .map((i) => indexed[i].id);
  } catch {
    return [];
  }
}

export interface BugMemoryEnrichment {
  aliases: string[];
  relatedFiles: string[];
  severity?: 'critical' | 'high' | 'medium' | 'low';
  status?: 'open' | 'in_progress' | 'resolved' | 'wont_fix';
}

/** Groq enrichment on bug save — aliases, files, inferred severity */
export async function enrichBugMemory(
  llm: LlmProvider,
  title: string,
  content: string,
  metadata?: Record<string, unknown>,
): Promise<BugMemoryEnrichment> {
  const raw = await llm.chat(
    [
      {
        role: 'system',
        content:
          'Enrich a bug memory for search. Return JSON: { "aliases": ["yellow strip", "bus banner"], "relatedFiles": ["lib/ui/bus_strip.dart"], "severity": "medium", "status": "open" }. aliases: 2-5 informal names devs might search. relatedFiles: 0-3 likely paths. severity/status only if clear from text.',
      },
      {
        role: 'user',
        content: `Title: ${title}\nContent: ${content.slice(0, 2000)}\nExisting metadata: ${JSON.stringify(metadata ?? {})}`,
      },
    ],
    { maxTokens: 200, temperature: 0.1 },
  );

  try {
    const parsed = JSON.parse(raw) as BugMemoryEnrichment;
    return {
      aliases: (parsed.aliases ?? []).filter((a) => typeof a === 'string').slice(0, 5),
      relatedFiles: (parsed.relatedFiles ?? []).filter((f) => typeof f === 'string').slice(0, 3),
      severity: parsed.severity,
      status: parsed.status,
    };
  } catch {
    return { aliases: [], relatedFiles: [] };
  }
}

export interface SessionContextInference {
  inferredTask: string;
  warnings: string[];
}

/** Infer task + surface past-bug warnings for session start */
export async function inferSessionContext(
  llm: LlmProvider,
  userMessage: string,
  candidateMemories: Array<{ title: string; type: string; summary?: string | null }>,
): Promise<SessionContextInference> {
  const listing = candidateMemories
    .slice(0, 20)
    .map((m) => `- (${m.type}) ${m.title}: ${(m.summary ?? '').slice(0, 80)}`)
    .join('\n');

  const raw = await llm.chat(
    [
      {
        role: 'system',
        content:
          'Infer what the developer is working on and warn about relevant past bugs/decisions. Return JSON: { "inferredTask": "one sentence", "warnings": ["you fixed X before", ...] }. warnings: 0-3, only if memories support it.',
      },
      { role: 'user', content: `User message: ${userMessage.slice(0, 500)}\n\nProject memories:\n${listing || '(none)'}` },
    ],
    { maxTokens: 200, temperature: 0.2 },
  );

  try {
    const parsed = JSON.parse(raw) as SessionContextInference;
    return {
      inferredTask: parsed.inferredTask?.trim() ?? userMessage.slice(0, 120),
      warnings: (parsed.warnings ?? []).filter((w) => typeof w === 'string').slice(0, 3),
    };
  } catch {
    return { inferredTask: userMessage.slice(0, 120), warnings: [] };
  }
}

/** Token-efficient brief for Cursor/Claude — Groq synthesizes hits into actionable prose */
export async function synthesizeRetrievalBrief(
  llm: LlmProvider,
  query: string,
  memories: Array<{ id: string; title: string; type: string; summary?: string | null }>,
): Promise<string> {
  if (!memories.length) {
    return 'No matching project memories.';
  }

  const listing = memories
    .slice(0, 8)
    .map((m) => `(${m.type}) ${m.title}: ${(m.summary ?? '').slice(0, 100)}`)
    .join('\n');

  return llm.chat(
    [
      {
        role: 'system',
        content:
          'Write a dense briefing for an AI coding agent. Use only facts from the memories. Max 100 words. Bullet points ok. Mention memory titles. No filler.',
      },
      { role: 'user', content: `Query: ${query}\n\nMemories:\n${listing}` },
    ],
    { maxTokens: 180, temperature: 0.2 },
  );
}

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
