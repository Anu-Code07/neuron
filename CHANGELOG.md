# Changelog

## [0.1.4] — 2026-07-06

### Added
- **Groq MCP tools:** `ask_project`, `suggest_context`, `condense_memories`, `suggest_relationships`, `extract_from_diff`, `find_duplicates`, `extract_memories`, `preview_memories`, `suggest_tags`
- Hosted API routes for all new AI tools
- API key panel: copy button inside input, separate Regenerate button

### Changed
- Dashboard docs updated with full tool list (31 tools)
- Landing page: 25+ MCP tools
- npm package published as `@anuraghq/neuron-mcp-server@0.1.4`

## [0.1.3] — 2026-07-05

### Added
- Interactive `npx @anuraghq/neuron-mcp-server init` with API key prompt
- One API key per user (DB migration)
- Hosted MCP proxy via `NEURON_API_KEY` — no Supabase secrets for customers
- Install command helpers in dashboard MCP Setup

### Changed
- Dashboard branding: Plus Jakarta Sans, new logo, contextual landing marquee
- Simplified customer install flow

## [0.1.0] — Initial

- Context Engine with hybrid search and knowledge graph
- MCP server with remember/search/context tools
- Supabase-backed dashboard
