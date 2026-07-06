import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ContextEngine } from '@neuron/context-engine';
import { readNeuronRepoEnv, getAgentInstructions } from '@neuron/shared';

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
    const keyProjectId = await resolveHostedProjectId(apiUrl, apiKey);
    const envProjectId = process.env.NEURON_PROJECT_ID?.trim();
    const projectId = envProjectId || keyProjectId;
    const repoTag = readNeuronRepoEnv();
    engine = createHostedEngine(apiUrl, apiKey, projectId, { repoTag, projectOverride: envProjectId });
    defaultProjectId = projectId;
    const repoNote = repoTag ? `, repo ${repoTag}` : '';
    console.error(
      `Neuron MCP: hosted → ${apiUrl} (project ${projectId.slice(0, 8)}…${repoNote}) · try get_workspace_context`,
    );
  } else {
    const deps = resolveEngineDeps();
    engine = new ContextEngine(deps);
    console.error('Neuron MCP: direct mode (Supabase env vars)');
  }

  const server = new McpServer({
    name: 'neuron',
    version: '0.1.10',
  });

  registerTools(server, engine, { defaultProjectId, defaultRepoTag: readNeuronRepoEnv() });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Neuron MCP: call cheatsheet first, then get_workspace_context');
  console.error(getAgentInstructions().split('\n').slice(0, 6).join('\n'));
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
