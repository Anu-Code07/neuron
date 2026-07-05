# Context Engine Design

## What Makes Neuron a Context Engine

A **memory system** asks: "What happened?"

A **context engine** asks: "What does the AI need to know *right now* to do this task well?"

Neuron implements four core capabilities:

### 1. Selective Ingestion

Not everything deserves permanent storage. The ingest pipeline classifies input:

| Input Type | Action |
|------------|--------|
| Architectural decision | Store as `decision` (permanent) |
| Bug report with reproduction | Store as `bug` (permanent) |
| Casual chat / greetings | Discard |
| Code convention mention | Store as `pattern` (permanent) |
| File path reference | Store as `file` + link relationships |
| Task assignment | Store as `task` (TTL: task lifetime) |
| Raw conversation | Extract knowledge, discard raw |

### 2. Intelligent Retrieval

`getProjectContext(query, options)` assembles a context packet:

```
Input signals:
  - current task description
  - open files
  - git branch
  - recent edits (last N minutes)
  - explicit query from AI

Retrieval pipeline:
  1. Resolve scope (user → org → project → branch → task)
  2. Seed entities from open files + branch + task
  3. Graph expand (1–2 hops) from seed entities
  4. Vector search for semantic matches to query
  5. Keyword search for exact terms (API names, table names)
  6. Merge + deduplicate + rank by composite score
  7. Compress into token-budgeted packet
  8. Return ContextPacket
```

### 3. Active Forgetting

Memories decay unless reinforced:

- **Confidence decay**: unused memories lose confidence over time
- **Supersession**: new decisions mark old ones as `superseded`
- **Merge**: duplicate facts are merged with higher confidence
- **Explicit forget**: `forget_memory` tool for user/AI-initiated removal
- **TTL expiry**: branch/task/conversation layers auto-expire

### 4. Context Compression

Before sending to AI, the engine compresses:

- Summarize long architecture docs into bullet points
- Collapse duplicate facts
- Prioritize by relevance to current task
- Include relationship paths only when they add value
- Report `tokenEstimate` so clients can request more/less

## Memory Types

Each type has a schema, default TTL, and retrieval weight:

| Type | Permanent | Retrieval Weight | Example |
|------|-----------|------------------|---------|
| `architecture` | Yes | High | "Monorepo with pnpm workspaces" |
| `decision` | Yes | High | "Chose Supabase over Clerk for auth" |
| `pattern` | Yes | Medium | "Use sealed classes for BLoC states" |
| `fact` | Yes | Medium | "API base URL is /api/v2" |
| `component` | Yes | Medium | "AuthProvider wraps the app" |
| `api` | Yes | High | "POST /auth/login returns JWT" |
| `database` | Yes | High | "users table has RLS on org_id" |
| `bug` | Yes | High (if open) | "Login fails on Safari < 17" |
| `task` | No | Highest (active) | "Implement OAuth callback" |
| `file` | Yes | Medium | "src/auth/callback.ts" |
| `note` | Yes | Low | "Consider rate limiting later" |
| `conversation` | No | Low | Raw chat (extracted, not stored) |

## Relationship Types

```
USES          A ──USES──► B
REFERENCES    A ──REFERENCES──► B
DEPENDS_ON    A ──DEPENDS_ON──► B
IMPLEMENTS    A ──IMPLEMENTS──► B
SUPERSEDES    A ──SUPERSEDES──► B
RELATED_TO    A ──RELATED_TO──► B
CALLS         A ──CALLS──► B
CONTAINS      A ──CONTAINS──► B
BLOCKS        A ──BLOCKS──► B
FIXES         A ──FIXES──► B
```

## Context Packet Format

The MCP tool `get_project_context` returns:

```json
{
  "project": { "name": "neuron", "techStack": ["Next.js", "Supabase"] },
  "architecture": {
    "summary": "Monorepo: dashboard + MCP server + context engine",
    "layers": ["apps/dashboard", "packages/context-engine", "packages/mcp-server"]
  },
  "decisions": [
    {
      "title": "Authentication Provider",
      "value": "Supabase Auth",
      "reason": "Pricing and RLS integration",
      "confidence": 0.95
    }
  ],
  "conventions": [
    { "title": "State Management", "description": "BLoC with sealed classes" }
  ],
  "activeBugs": [],
  "relevantApis": [],
  "relatedComponents": [],
  "currentTask": null,
  "tokenEstimate": 847
}
```

## Scoring Formula

```
score = (
  semantic_similarity * 0.35 +
  keyword_match      * 0.20 +
  graph_proximity    * 0.15 +
  recency            * 0.15 +
  importance         * 0.10 +
  layer_priority     * 0.05
) * confidence
```

Layer priority: Task (1.0) > Branch (0.8) > Project (0.6) > Org (0.4) > User (0.3)
