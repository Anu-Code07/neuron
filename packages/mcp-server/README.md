# @neuron/mcp-server

Neuron Context Engine MCP server — structured memory for Cursor, Claude Desktop, and any MCP client.

## One-command install (customers)

Get your API key from the [Neuron dashboard](https://neuron-azure.vercel.app) → MCP Setup.

```bash
npx @anuraghq/neuron-mcp-server init --api-key nrn_your_key_here
```

Or run without flags — you'll be prompted to paste your key:

```bash
npx @anuraghq/neuron-mcp-server init
```

Restart Cursor → Settings → MCP → confirm **neuron** is connected.

### Manual config (Cursor / Claude Desktop)

Add to `~/.cursor/mcp.json` or Claude's `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "neuron": {
      "command": "npx",
      "args": ["-y", "@neuron/mcp-server"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "NEURON_PROJECT_ID": "your-project-uuid"
      }
    }
  }
}
```

## Tools

`remember_fact`, `remember_decision`, `search_memory`, `get_project_context`, and 12 more.

## Publishing (maintainers)

```bash
cd packages/mcp-server
pnpm build:publish
npm publish --access public
```

Requires npm org `@neuron` and published workspace deps, or use `build:publish` which bundles everything into a single file.

## Local development

```bash
pnpm --filter @neuron/mcp-server build
node packages/mcp-server/dist/index.js
```
