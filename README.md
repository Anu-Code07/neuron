# Neuron

**Context Operating System for AI** — powered by Supabase.

## Stack

- **Dashboard** — Next.js 15 (supermemory-style IDE)
- **Backend** — Supabase (Postgres, Auth, RLS, pgvector)
- **MCP Server** — Context Engine tools for Cursor, Claude, etc.
- **Context Engine** — Hybrid retrieval, knowledge graph, compression

## Quick Start

```bash
pnpm install

# Run Supabase migrations
supabase db push

# Dashboard
cp apps/dashboard/.env.local.example apps/dashboard/.env.local
pnpm --filter dashboard dev

# MCP Server
cp packages/mcp-server/.env.example packages/mcp-server/.env
pnpm --filter @neuron/mcp-server build
node packages/mcp-server/dist/index.js
```

## MCP Setup (Cursor / Claude)

**Customers — one command:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-key \
NEURON_PROJECT_ID=your-project-uuid \
npx @neuron/mcp-server init
```

**Maintainers — publish to npm:** see [docs/publish-mcp.md](docs/publish-mcp.md)

**Local dev:**

```bash
cp packages/mcp-server/.env.example packages/mcp-server/.env
pnpm --filter @neuron/mcp-server build
node packages/mcp-server/dist/index.js
```

## Deploy (Vercel)

1. Import the repo on [Vercel](https://vercel.com/new)
2. Set **Root Directory** to `apps/dashboard`
3. `vercel.json` handles monorepo install/build automatically
4. Add env vars from `.env.example`

## Supabase

Set in dashboard `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server/MCP only)

Run migrations in `supabase/migrations/`.

## MCP Tools

`remember_*`, `search_memory`, `get_project_context`, `forget_memory`, `merge_memory`, and more.
