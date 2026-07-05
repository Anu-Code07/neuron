#!/usr/bin/env node
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ContextEngine } from '@neuron/context-engine';

import { registerTools } from './tools/register.js';
import { resolveEngineDeps } from './adapters/resolve-deps.js';

async function main() {
  const deps = resolveEngineDeps();
  const engine = new ContextEngine(deps);

  const server = new McpServer({
    name: 'neuron',
    version: '0.1.0',
  });

  registerTools(server, engine);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Neuron Context Engine MCP Server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
