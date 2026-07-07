# @anuraghq/neuron-mcp-server

Neuron Context Engine MCP server — structured memory for Cursor, Claude Desktop, Antigravity, and any MCP client.

**npm:** `@anuraghq/neuron-mcp-server@0.2.0`

## One-command install

Get your API key from [neuron-azure.vercel.app](https://neuron-azure.vercel.app) → MCP Setup.

```bash
npx @anuraghq/neuron-mcp-server init --api-key nrn_your_key_here
```

Or run interactively — paste your key when prompted:

```bash
npx @anuraghq/neuron-mcp-server init
```

Restart your MCP client(s). Works with Cursor, Claude Desktop, and any MCP host.

### Install targets (default: Cursor + Claude)

```bash
# Both Cursor (~/.cursor/mcp.json) and Claude Desktop
npx @anuraghq/neuron-mcp-server init --api-key nrn_your_key_here

# Cursor only
npx @anuraghq/neuron-mcp-server init --cursor --api-key nrn_your_key_here

# Claude Desktop only (macOS: ~/Library/Application Support/Claude/claude_desktop_config.json)
npx @anuraghq/neuron-mcp-server init --claude --api-key nrn_your_key_here

# Print JSON for any other MCP client
npx @anuraghq/neuron-mcp-server init --stdout --api-key nrn_your_key_here
```

With `NEURON_API_KEY`, the MCP server proxies all tool calls to the hosted Neuron API. Supabase and Groq credentials stay on the server — customers only need one key.

## Tools (31)

### Remember
`remember_fact`, `remember_decision`, `remember_pattern`, `remember_bug`, `remember_component`, `remember_api`, `remember_task`, `remember_architecture`, `remember_database`, `remember_note`, `remember_file`, `remember_conversation`, `remember_relationship`

### Retrieve
`search_memory`, `get_project_context`, `get_task_context`, `get_file_context`, `get_architecture`, `find_related`, `summarize_project`

### Manage
`forget_memory`, `merge_memory`, `find_duplicates`, `condense_memories`

### Groq AI (server-side)
| Tool | Description |
|------|-------------|
| `extract_memories` | Extract + save memories from a conversation |
| `preview_memories` | Preview extraction without saving |
| `extract_from_diff` | Extract learnings from a git diff |
| `ask_project` | Q&A over project memories |
| `suggest_context` | Recommend memories for a task |
| `suggest_tags` | Auto-tag a memory |
| `suggest_relationships` | Propose knowledge graph links |

## Manual config

Add to your editor's MCP config (e.g. `~/.cursor/mcp.json`, Claude Desktop config, or Antigravity settings):

```json
{
  "mcpServers": {
    "neuron": {
      "command": "npx",
      "args": ["-y", "@anuraghq/neuron-mcp-server"],
      "env": {
        "NEURON_API_KEY": "nrn_your_key_here"
      }
    }
  }
}
```

## Publishing (maintainers)

```bash
cd packages/mcp-server
NPM_PUBLISH_NAME=@anuraghq/neuron-mcp-server pnpm publish:npm
```

See [docs/publish-mcp.md](../../docs/publish-mcp.md) in the monorepo.

## Local development

```bash
pnpm --filter @neuron/mcp-server build
node packages/mcp-server/dist/index.js
```

For direct Supabase mode (no hosted API), set `SUPABASE_SERVICE_ROLE_KEY` and `NEURON_PROJECT_ID` in `.env`.
