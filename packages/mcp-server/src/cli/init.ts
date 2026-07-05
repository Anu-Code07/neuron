import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

/** Published npm package — update when @neuron org is claimed */
export const NPX_PACKAGE = '@anuraghq/neuron-mcp-server';
export const DEFAULT_API_URL = 'https://neuron-azure.vercel.app';

interface InitOptions {
  cursor?: boolean;
  project?: boolean;
  stdout?: boolean;
  apiKey?: string;
  apiUrl?: string;
  interactive?: boolean;
  /** @deprecated Direct mode — for local dev only */
  supabaseUrl?: string;
  serviceRoleKey?: string;
  projectId?: string;
}

function parseArgs(argv: string[]): InitOptions {
  const opts: InitOptions = { cursor: true, interactive: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--project') opts.project = true;
    if (arg === '--stdout') opts.stdout = true;
    if (arg === '--no-interactive') opts.interactive = false;
    if (arg === '--api-key') opts.apiKey = argv[++i];
    if (arg === '--api-url') opts.apiUrl = argv[++i];
    if (arg === '--supabase-url') opts.supabaseUrl = argv[++i];
    if (arg === '--service-key') opts.serviceRoleKey = argv[++i];
    if (arg === '--project-id') opts.projectId = argv[++i];
  }
  return opts;
}

function missingKeyMessage(): string {
  return (
    'Missing API key. Get one from the Neuron dashboard → MCP Setup, then run:\n\n' +
    `  npx ${NPX_PACKAGE} init --api-key nrn_your_key_here\n\n` +
    'Or run without flags and paste your key when prompted:\n\n' +
    `  npx ${NPX_PACKAGE} init`
  );
}

async function promptApiKey(): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    stdout.write('\nNeuron MCP setup\n');
    stdout.write('Get your key at https://neuron-azure.vercel.app → MCP Setup\n\n');
    const key = (await rl.question('Paste your API key (nrn_...): ')).trim();
    if (!key.startsWith('nrn_')) {
      throw new Error('Invalid key — must start with nrn_');
    }
    return key;
  } finally {
    rl.close();
  }
}

async function resolveApiKey(opts: InitOptions): Promise<string | undefined> {
  const fromFlag = opts.apiKey;
  const fromEnv = process.env.NEURON_API_KEY;
  if (fromFlag?.startsWith('nrn_')) return fromFlag;
  if (fromEnv?.startsWith('nrn_')) return fromEnv;

  if (opts.interactive && stdin.isTTY) {
    return promptApiKey();
  }

  return undefined;
}

function buildHostedConfig(apiKey: string, apiUrl?: string) {
  return {
    command: 'npx',
    args: ['-y', NPX_PACKAGE],
    env: {
      NEURON_API_KEY: apiKey,
      NEURON_API_URL: apiUrl ?? process.env.NEURON_API_URL ?? DEFAULT_API_URL,
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
      'Direct mode requires Supabase env vars. Prefer hosted mode with --api-key nrn_...',
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

async function buildNeuronConfig(opts: InitOptions) {
  const apiKey = await resolveApiKey(opts);
  if (apiKey) return buildHostedConfig(apiKey, opts.apiUrl);

  const hasDirect =
    (opts.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    (opts.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    (opts.projectId ?? process.env.NEURON_PROJECT_ID);

  if (hasDirect) return buildDirectConfig(opts);

  throw new Error(missingKeyMessage());
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
  const neuronConfig = await buildNeuronConfig(opts);
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
