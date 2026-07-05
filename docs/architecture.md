# Neuron Architecture

> **Neuron is a Context Engine** — not a memory dump. It decides what to remember, what to forget, and what to send to AI at the right time.

## Positioning

| Memory System | Context Engine |
|---------------|----------------|
| Stores everything | Curates selectively |
| Optimizes for retention | Optimizes for relevance |
| Returns history | Returns compressed context packets |
| Passive accumulation | Active retrieval + compression |

Neuron compiles project knowledge into **AI-ready context packets** optimized for token efficiency and assistant comprehension.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Assistants (MCP Clients)               │
│         Claude · Cursor · VS Code · Gemini · OpenAI         │
└─────────────────────────────┬───────────────────────────────┘
                              │ MCP Protocol
┌─────────────────────────────▼───────────────────────────────┐
│                     Neuron MCP Server                        │
│  remember_* · search_memory · get_project_context · forget  │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                      Context Engine                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Ingest   │ │ Extract  │ │ Retrieve │ │  Compress    │   │
│  │ Pipeline │ │ Pipeline │ │  Engine  │ │   Engine     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    Knowledge Graph Layer                     │
│         Entities · Relationships · Embeddings (pgvector)     │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐  ┌────────────▼──────────────┐
│     SQLite Local Cache      │  │    Supabase Cloud (PG)      │
│   Offline · Fast · Sync     │  │  Auth · RLS · Realtime      │
└─────────────────────────────┘  └─────────────────────────────┘
                                              │
                              ┌───────────────▼───────────────┐
                              │   Next.js Dashboard (React)   │
                              └───────────────────────────────┘
```

## Context Layers

Neuron organizes knowledge across six layers, each with different TTL and retrieval priority:

| Layer | Scope | Examples | TTL |
|-------|-------|----------|-----|
| L1 User | Personal | Preferences, coding style, experience | Permanent |
| L2 Organization | Team | Standards, shared APIs, org projects | Permanent |
| L3 Project | Repository | Architecture, tech stack, conventions | Permanent |
| L4 Branch | Git branch | Feature context, modified files, PRs | Session |
| L5 Task | Active work | Goals, requirements, acceptance criteria | Task |
| L6 Conversation | Ephemeral | Recent prompts, errors, generated code | Hours |

**Key principle:** Layers 1–3 are durable knowledge. Layers 4–6 are ephemeral context that feeds retrieval but is rarely stored permanently.

## Memory Pipeline

```
Raw Input (conversation, file edit, commit, PR)
        │
        ▼
   AI Extraction ──► Structured Memory Types
        │              (decision, fact, pattern, bug, api, ...)
        ▼
   Relationship Linking ──► Knowledge Graph edges
        │
        ▼
   Embedding Generation ──► pgvector storage
        │
        ▼
   Importance Scoring ──► Retention policy (remember / decay / forget)
        │
        ▼
   Stored Knowledge (never raw conversations by default)
```

## Context Retrieval

`getProjectContext()` does NOT return conversations. It returns a **Context Packet**:

```typescript
interface ContextPacket {
  architecture: ArchitectureSummary;
  relevantDecisions: Decision[];
  codingConventions: Pattern[];
  knownBugs: Bug[];
  relatedComponents: Component[];
  activeApis: Api[];
  currentTask?: TaskContext;
  recentChanges: Change[];
  dependencies: DependencyGraph;
  tokenEstimate: number;
}
```

Retrieval uses hybrid search:

1. **Vector search** — semantic similarity via pgvector
2. **Keyword search** — full-text on titles and content
3. **Graph traversal** — follow relationships from seed entities
4. **Recency boost** — recent edits and commits rank higher
5. **Importance score** — confidence × access frequency × explicit pinning
6. **Layer filtering** — task/branch context takes priority over project context

## Monorepo Structure

```
neuron/
├── apps/
│   └── dashboard/              # Next.js 15 — admin UI
├── packages/
│   ├── shared/                 # Domain types, constants, utilities
│   ├── context-engine/         # Core engine: ingest, retrieve, compress
│   ├── mcp-server/             # MCP protocol server
│   └── supabase/               # Supabase client + generated types
├── supabase/
│   ├── migrations/             # PostgreSQL schema
│   └── config.toml
└── docs/
```

## Package Boundaries

```
dashboard ──► context-engine ──► shared
mcp-server  ──► context-engine ──► shared
context-engine ──► supabase ──► shared
```

- **shared**: Pure types and utilities. No I/O.
- **supabase**: Database client, RLS-aware queries, type generation.
- **context-engine**: All business logic. Framework-agnostic.
- **mcp-server**: Thin MCP adapter over context-engine.
- **dashboard**: UI only. Calls context-engine via server actions / API routes.

## Security Model

- Supabase Auth (JWT) for dashboard users
- API keys (hashed) for MCP server authentication
- Row Level Security on every table
- Organization → Project → Memory hierarchy for access control
- Audit logs on all write operations

## Scalability Considerations

- **SQLite cache** for offline MCP clients (sync on reconnect)
- **Incremental embedding** — only re-embed on content change
- **Context snapshots** — pre-computed packets for hot projects
- **Partitioning** — embeddings table partitioned by project_id
- **Streaming retrieval** — return context in priority order, stop at token budget

## Implementation Phases

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Monorepo, schema, auth, dashboard shell | In Progress |
| 2 | Knowledge graph, memory engine, CRUD | Planned |
| 3 | MCP server, context retrieval APIs | Planned |
| 4 | Embeddings, hybrid search | Planned |
| 5 | Realtime, organizations, comments | Planned |
| 6 | Public API, SDK, billing | Planned |
