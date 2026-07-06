import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ContextEngine } from '@neuron/context-engine';

import { registerTools } from './tools/register.js';
import { resolveEngineDeps } from './adapters/resolve-deps.js';
import {
  createHostedEngine,
  getHostedConfig,
  isHostedMode,
  resolveHostedProjectId,
} from './adapters/hosted-client.js';
import { runInit } from './cli/init.js';

async function startServer() {
  let engine: ContextEngine;
  let defaultProjectId: string | undefined;

  if (isHostedMode()) {
    const { apiKey, apiUrl } = getHostedConfig();
    const projectId = await resolveHostedProjectId(apiUrl, apiKey);
    engine = createHostedEngine(apiUrl, apiKey, projectId);
    defaultProjectId = projectId;
    console.error(`Neuron MCP: hosted mode → ${apiUrl} (project ${projectId.slice(0, 8)}…)`);
  } else {
    const deps = resolveEngineDeps();
    engine = new ContextEngine(deps);
    console.error('Neuron MCP: direct mode (Supabase env vars)');
  }

  const server = new McpServer({
    name: 'neuron',
    version: '0.1.0',
  });

  registerTools(server, engine, { defaultProjectId });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Neuron Context Engine MCP Server running on stdio');
}

const subcommand = process.argv[2];

if (subcommand === 'init') {
  runInit(process.argv.slice(3)).catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
} else {
  startServer().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
