# Neuron

**Context Operating System for AI** — structured project memory for Cursor, Claude, Antigravity, and any MCP client.

Live dashboard: [neuron-azure.vercel.app](https://neuron-azure.vercel.app)

## Stack

- **Dashboard** — Next.js 15
- **Backend** — Supabase (Postgres, Auth, RLS, pgvector)
- **MCP Server** — `@anuraghq/neuron-mcp-server` on npm
- **Context Engine** — Hybrid retrieval, knowledge graph, Groq-powered AI tools

## Customer setup (60 seconds)

1. Open [MCP Setup](https://neuron-azure.vercel.app) → generate your API key
2. Run:

```bash
npx @anuraghq/neuron-mcp-server init --api-key nrn_your_key_here
```

3. Restart your editor → MCP settings → confirm **neuron** is connected

No Supabase or Groq credentials needed on the client — the hosted backend handles everything via `NEURON_API_KEY`.

## MCP tools (31)

| Category | Tools |
|----------|-------|
| **Remember** | `remember_fact`, `remember_decision`, `remember_pattern`, `remember_bug`, `remember_component`, `remember_api`, `remember_task`, `remember_architecture`, `remember_database`, `remember_note`, `remember_file`, `remember_conversation`, `remember_relationship` |
| **Retrieve** | `search_memory`, `get_project_context`, `get_task_context`, `get_file_context`, `get_architecture`, `find_related`, `summarize_project` |
| **Manage** | `forget_memory`, `merge_memory`, `find_duplicates`, `condense_memories` |
| **Groq AI** | `extract_memories`, `preview_memories`, `extract_from_diff`, `ask_project`, `suggest_context`, `suggest_tags`, `suggest_relationships` |

Groq runs server-side for summarization, reranking, extraction, Q&A, and duplicate detection.

## Local development

```bash
pnpm install
supabase db push

cp apps/dashboard/.env.local.example apps/dashboard/.env.local
pnpm --filter dashboard dev
```

See [docs/architecture.md](docs/architecture.md) and [docs/context-engine.md](docs/context-engine.md).

## Maintainer setup

**MCP server (local):**

```bash
cp packages/mcp-server/.env.example packages/mcp-server/.env
pnpm --filter @neuron/mcp-server build
node packages/mcp-server/dist/index.js
```

**Publish npm package:** see [docs/publish-mcp.md](docs/publish-mcp.md)

Current npm version: `@anuraghq/neuron-mcp-server@0.1.4`

## Deploy (Vercel)

1. Import repo on [Vercel](https://vercel.com/new)
2. Set **Root Directory** to `apps/dashboard`
3. Add env vars from `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`
   - `NEXT_PUBLIC_NEURON_PROJECT_ID`, `NEXT_PUBLIC_APP_URL`

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
