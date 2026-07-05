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

## MCP Setup (Cursor)

Copy `.cursor/mcp.json.example` to `.cursor/mcp.json` and fill in your Supabase keys.

## Supabase

Set in dashboard `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server/MCP only)

Run migrations in `supabase/migrations/`.

## MCP Tools

`remember_*`, `search_memory`, `get_project_context`, `forget_memory`, `merge_memory`, and more.
