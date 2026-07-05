import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Published npm package — update when @neuron org is claimed */
const NPX_PACKAGE = '@anuraghq/neuron-mcp-server';
const DEFAULT_API_URL = 'https://neuron-azure.vercel.app';

interface InitOptions {
  cursor?: boolean;
  project?: boolean;
  stdout?: boolean;
  apiKey?: string;
  apiUrl?: string;
  /** @deprecated Direct mode — for local dev only */
  supabaseUrl?: string;
  serviceRoleKey?: string;
  projectId?: string;
}

function parseArgs(argv: string[]): InitOptions {
  const opts: InitOptions = { cursor: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--project') opts.project = true;
    if (arg === '--stdout') opts.stdout = true;
    if (arg === '--api-key') opts.apiKey = argv[++i];
    if (arg === '--api-url') opts.apiUrl = argv[++i];
    if (arg === '--supabase-url') opts.supabaseUrl = argv[++i];
    if (arg === '--service-key') opts.serviceRoleKey = argv[++i];
    if (arg === '--project-id') opts.projectId = argv[++i];
  }
  return opts;
}

function buildHostedConfig(opts: InitOptions) {
  const apiKey = opts.apiKey ?? process.env.NEURON_API_KEY;
  const apiUrl = opts.apiUrl ?? process.env.NEURON_API_URL ?? DEFAULT_API_URL;

  if (!apiKey?.startsWith('nrn_')) {
    throw new Error(
      'Missing NEURON_API_KEY. Get one from the Neuron dashboard → Settings, then:\n' +
        '  NEURON_API_KEY=nrn_... npx @anuraghq/neuron-mcp-server init\n' +
        'Or pass: --api-key nrn_... [--api-url https://neuron-azure.vercel.app]',
    );
  }

  return {
    command: 'npx',
    args: ['-y', NPX_PACKAGE],
    env: {
      NEURON_API_KEY: apiKey,
      NEURON_API_URL: apiUrl,
    },
  };
}

/** Legacy direct Supabase mode — local development only */
function buildDirectConfig(opts: InitOptions) {
  const supabaseUrl = opts.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = opts.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const projectId = opts.projectId ?? process.env.NEURON_PROJECT_ID;

  if (!supabaseUrl || !serviceRoleKey || !projectId) {
    throw new Error(
      'Direct mode requires Supabase env vars. Prefer hosted mode with NEURON_API_KEY.',
    );
  }

  return {
    command: 'npx',
    args: ['-y', NPX_PACKAGE],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
      NEURON_PROJECT_ID: projectId,
    },
  };
}

function buildNeuronConfig(opts: InitOptions) {
  const apiKey = opts.apiKey ?? process.env.NEURON_API_KEY;
  if (apiKey?.startsWith('nrn_')) return buildHostedConfig(opts);

  // Fall back to direct mode only when full Supabase creds are present
  const hasDirect =
    (opts.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    (opts.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    (opts.projectId ?? process.env.NEURON_PROJECT_ID);

  if (hasDirect) return buildDirectConfig(opts);
  return buildHostedConfig(opts);
}

function mergeMcpJson(existing: Record<string, unknown>, neuronConfig: unknown) {
  const servers = (existing.mcpServers as Record<string, unknown>) ?? {};
  return { ...existing, mcpServers: { ...servers, neuron: neuronConfig } };
}

export async function runInit(argv: string[]): Promise<void> {
  try {
    const { config } = await import('dotenv');
    config();
  } catch {
    /* dotenv optional */
  }

  const opts = parseArgs(argv);
  const neuronConfig = buildNeuronConfig(opts);
  const output = { mcpServers: { neuron: neuronConfig } };

  if (opts.stdout) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  const targets: string[] = [];
  if (opts.project) targets.push(join(process.cwd(), '.cursor', 'mcp.json'));
  if (opts.cursor !== false) targets.push(join(homedir(), '.cursor', 'mcp.json'));

  for (const target of targets) {
    mkdirSync(join(target, '..'), { recursive: true });
    let existing: Record<string, unknown> = {};
    if (existsSync(target)) {
      existing = JSON.parse(readFileSync(target, 'utf8')) as Record<string, unknown>;
    }
    const merged = mergeMcpJson(existing, neuronConfig);
    writeFileSync(target, `${JSON.stringify(merged, null, 2)}\n`);
    console.log(`✓ Wrote neuron MCP config → ${target}`);
  }

  console.log('\nRestart Cursor → Settings → MCP → confirm "neuron" is connected.');
}
