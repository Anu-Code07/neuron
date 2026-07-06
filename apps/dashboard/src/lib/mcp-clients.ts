export const MCP_CLIENT_DEFS = [
  { slug: 'cursor', name: 'Cursor', setup: 'Settings → MCP' },
  { slug: 'claude', name: 'Claude Desktop', setup: 'Quit & reopen app' },
  { slug: 'antigravity', name: 'Antigravity', setup: 'MCP settings' },
  { slug: 'vscode', name: 'VS Code', setup: 'MCP extension' },
] as const;

export type McpClientSlug = (typeof MCP_CLIENT_DEFS)[number]['slug'] | 'other' | 'windsurf';

export type McpClientMap = Partial<Record<string, string>>;

const ACTIVE_MS = 7 * 24 * 60 * 60 * 1000;

export function parseMcpClientTimestamp(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function isMcpClientActive(mcpClients: McpClientMap | null | undefined, slug: string): boolean {
  const ts = parseMcpClientTimestamp(mcpClients?.[slug]);
  if (!ts) return false;
  return Date.now() - ts.getTime() < ACTIVE_MS;
}

export function countActiveMcpClients(mcpClients: McpClientMap | null | undefined): number {
  return MCP_CLIENT_DEFS.filter((c) => isMcpClientActive(mcpClients, c.slug)).length;
}

export function formatMcpClientLastSeen(mcpClients: McpClientMap | null | undefined, slug: string): string | null {
  const ts = parseMcpClientTimestamp(mcpClients?.[slug]);
  if (!ts) return null;
  const diffMs = Date.now() - ts.getTime();
  if (diffMs < 60_000) return 'Active now';
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return ts.toLocaleDateString();
}

export function normalizeMcpClientHeader(header: string | null): string | null {
  if (!header?.trim()) return null;
  const c = header.trim().toLowerCase();
  if (['cursor', 'claude', 'antigravity', 'vscode', 'windsurf', 'other'].includes(c)) return c;
  return 'other';
}
