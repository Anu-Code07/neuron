# Publishing @anuraghq/neuron-mcp-server

## One-time setup

### 1. npm access

```bash
npm login
# Package is published as @anuraghq/neuron-mcp-server
```

### 2. GitHub secret (optional CI)

In GitHub → **Settings → Secrets → Actions**, add:

| Secret | Value |
|--------|--------|
| `NPM_TOKEN` | npm access token with publish permission |

### 3. Publish

**Manual (current)**

```bash
cd packages/mcp-server
NPM_PUBLISH_NAME=@anuraghq/neuron-mcp-server pnpm publish:npm
```

**GitHub Release (optional)**

```bash
git tag mcp-server-v0.1.4
git push origin mcp-server-v0.1.4
# Create GitHub Release from tag → CI can publish automatically
```

---

## Customer install (after publish)

```bash
npx @anuraghq/neuron-mcp-server init --api-key nrn_your_key_here
```

Restart your editor. Works with Cursor, Claude Desktop, Antigravity, and any MCP client. No Supabase or Groq secrets needed.

---

## Hosted MCP (live)

| Phase | Status |
|-------|--------|
| **Now** | Single `NEURON_API_KEY` → hosted backend proxies to Supabase + Groq |
| **Future** | OAuth hosted MCP at a single URL (like Supabase MCP) |

Customers get one API key from the dashboard. All 31 MCP tools run server-side with Groq.
