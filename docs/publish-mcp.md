# Publishing @neuron/mcp-server

## One-time setup

### 1. Create npm organization

```bash
npm login
npm org create neuron
# Or publish unscoped: change name to "neuron-mcp" in package.json
```

### 2. Add GitHub secret

In GitHub → **Settings → Secrets → Actions**, add:

| Secret | Value |
|--------|--------|
| `NPM_TOKEN` | npm access token with publish permission ([npmjs.com/settings/tokens](https://www.npmjs.org/settings/tokens)) |

### 3. Publish

**Option A — GitHub Release (recommended)**

```bash
# Bump version in packages/mcp-server/package.json
git tag mcp-server-v0.1.0
git push origin mcp-server-v0.1.0
# Create GitHub Release from tag → CI publishes automatically
```

**Option B — Manual**

```bash
cd packages/mcp-server
pnpm publish:npm
```

---

## Customer install (after publish)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-key \
NEURON_PROJECT_ID=your-project-uuid \
npx @neuron/mcp-server init
```

Restart Cursor. No clone, no build, no absolute paths.

---

## Roadmap: zero-config hosted MCP

Today customers paste 3 secrets. Future options:

| Phase | UX |
|-------|-----|
| **Now** | `npx @neuron/mcp-server init` + 3 env vars from dashboard |
| **Next** | Single `NEURON_API_KEY` from dashboard → your backend proxies to Supabase |
| **Best** | Hosted MCP at `https://mcp.neuron.dev/mcp` with OAuth (like Supabase MCP) — one URL, no secrets in config |

Hosted MCP requires:
- Multi-tenant auth (OAuth or API keys)
- Edge/server MCP over SSE or streamable HTTP
- Per-user project scoping in RLS

See [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp) for the OAuth pattern to follow.
