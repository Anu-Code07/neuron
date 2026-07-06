export const MCP_NPX_PACKAGE = '@anuraghq/neuron-mcp-server';
export const DEFAULT_NEURON_API_URL = 'https://neuron-azure.vercel.app';
export const MCP_KEY_PLACEHOLDER = 'nrn_your_key_here';

/** Generic label for supported MCP hosts — use in UI copy */
export const MCP_CLIENTS_LABEL = 'Cursor, Claude, Antigravity, or any MCP client';

export const MCP_RESTART_HINT =
  'Restart your editor and confirm neuron is connected in MCP settings.';

export const MCP_MANUAL_CONFIG_HINT =
  'Paste into your editor\'s MCP settings if you prefer not to use the terminal.';

/** One-line install — writes Cursor + Claude Desktop config by default */
export function buildMcpInstallCommand(apiKey: string, repoSlug?: string) {
  const repoFlag = repoSlug ? ` --project --repo ${repoSlug}` : '';
  return `npx ${MCP_NPX_PACKAGE} init --api-key ${apiKey}${repoFlag}`;
}

/** Claude Desktop only */
export function buildClaudeInstallCommand(apiKey: string, repoSlug?: string) {
  const repoFlag = repoSlug ? ` --repo ${repoSlug}` : '';
  return `npx ${MCP_NPX_PACKAGE} init --claude --api-key ${apiKey}${repoFlag}`;
}

/** Cursor only, with repo isolation for this codebase */
export function buildCursorInstallCommand(apiKey: string, repoSlug?: string) {
  const repoFlag = repoSlug ? ` --project --repo ${repoSlug}` : ' --project';
  return `npx ${MCP_NPX_PACKAGE} init --cursor --api-key ${apiKey}${repoFlag}`;
}

/** Interactive — CLI prompts for the key (no flags needed) */
export const MCP_INTERACTIVE_INSTALL = `npx ${MCP_NPX_PACKAGE} init`;

export function buildMcpJsonConfig(
  apiKey: string,
  options?: { apiUrl?: string; projectId?: string; repoSlug?: string },
) {
  const apiUrl = options?.apiUrl ?? DEFAULT_NEURON_API_URL;
  const env: Record<string, string> = {
    NEURON_API_KEY: apiKey,
    NEURON_API_URL: apiUrl,
  };
  if (options?.projectId) env.NEURON_PROJECT_ID = options.projectId;
  if (options?.repoSlug) env.NEURON_REPO = options.repoSlug;

  return JSON.stringify(
    {
      mcpServers: {
        neuron: {
          command: 'npx',
          args: ['-y', MCP_NPX_PACKAGE],
          env,
        },
      },
    },
    null,
    2,
  );
}
