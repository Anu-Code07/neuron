export const MCP_NPX_PACKAGE = '@anuraghq/neuron-mcp-server';
export const DEFAULT_NEURON_API_URL = 'https://neuron-azure.vercel.app';
export const MCP_KEY_PLACEHOLDER = 'nrn_your_key_here';

/** Generic label for supported MCP hosts — use in UI copy */
export const MCP_CLIENTS_LABEL = 'Cursor, Claude, Antigravity, or any MCP client';

export const MCP_RESTART_HINT =
  'Restart your editor and confirm neuron is connected in MCP settings.';

export const MCP_MANUAL_CONFIG_HINT =
  'Paste into your editor\'s MCP settings if you prefer not to use the terminal.';

/** One-line install — works on Mac, Linux, and Windows */
export function buildMcpInstallCommand(apiKey: string) {
  return `npx ${MCP_NPX_PACKAGE} init --api-key ${apiKey}`;
}

/** Interactive — CLI prompts for the key (no flags needed) */
export const MCP_INTERACTIVE_INSTALL = `npx ${MCP_NPX_PACKAGE} init`;

export function buildMcpJsonConfig(apiKey: string, apiUrl = DEFAULT_NEURON_API_URL) {
  return JSON.stringify(
    {
      mcpServers: {
        neuron: {
          command: 'npx',
          args: ['-y', MCP_NPX_PACKAGE],
          env: {
            NEURON_API_KEY: apiKey,
            NEURON_API_URL: apiUrl,
          },
        },
      },
    },
    null,
    2,
  );
}
