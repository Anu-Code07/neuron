import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { normalizeRepoTag, getAgentInstructions } from '@neuron/shared';

/** Published npm package — update when @neuron org is claimed */
export const NPX_PACKAGE = '@anuraghq/neuron-mcp-server';
export const DEFAULT_API_URL = 'https://neuron-azure.vercel.app';

interface InitOptions {
  cursor?: boolean;
  claude?: boolean;
  project?: boolean;
  stdout?: boolean;
  apiKey?: string;
  apiUrl?: string;
  interactive?: boolean;
  repo?: string;
  /** @deprecated Direct mode — for local dev only */
  supabaseUrl?: string;
  serviceRoleKey?: string;
  projectId?: string;
}

export interface McpInstallTarget {
  label: string;
  path: string;
}

export function claudeDesktopConfigPath(): string {
  const home = homedir();
  if (platform() === 'darwin') {
    return join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  }
  if (platform() === 'win32') {
    const appData = process.env.APPDATA ?? join(home, 'AppData', 'Roaming');
    return join(appData, 'Claude', 'claude_desktop_config.json');
  }
  return join(home, '.config', 'Claude', 'claude_desktop_config.json');
}

/** Resolve MCP config file paths for supported clients */
export function resolveMcpInstallTargets(opts: InitOptions): McpInstallTarget[] {
  const explicitClient = opts.cursor === true || opts.claude === true;
  const includeCursor = explicitClient ? opts.cursor === true : true;
  const includeClaude = explicitClient ? opts.claude === true : true;

  const targets: McpInstallTarget[] = [];

  if (opts.project) {
    targets.push({ label: 'Cursor (this repo)', path: join(process.cwd(), '.cursor', 'mcp.json') });
  }
  if (includeCursor) {
    targets.push({ label: 'Cursor', path: join(homedir(), '.cursor', 'mcp.json') });
  }
  if (includeClaude) {
    targets.push({ label: 'Claude Desktop', path: claudeDesktopConfigPath() });
  }

  return targets;
}

function parseArgs(argv: string[]): InitOptions {
  const opts: InitOptions = { interactive: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--project') opts.project = true;
    if (arg === '--stdout') opts.stdout = true;
    if (arg === '--no-interactive') opts.interactive = false;
    if (arg === '--cursor') opts.cursor = true;
    if (arg === '--claude') opts.claude = true;
    if (arg === '--api-key') opts.apiKey = argv[++i];
    if (arg === '--api-url') opts.apiUrl = argv[++i];
    if (arg === '--repo') opts.repo = argv[++i];
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
    `  npx ${NPX_PACKAGE} init\n\n` +
    'By default, config is written for Cursor and Claude Desktop.\n' +
    'Use --cursor or --claude to target one client only.'
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

function resolveRepoTag(opts: InitOptions): string | undefined {
  const fromFlag = opts.repo ?? process.env.NEURON_REPO;
  if (fromFlag) return normalizeRepoTag(fromFlag);
  if (opts.project) return normalizeRepoTag(basename(process.cwd()));
  return undefined;
}

function buildHostedConfig(apiKey: string, apiUrl?: string, mcpClient?: string, opts?: InitOptions) {
  const env: Record<string, string> = {
    NEURON_API_KEY: apiKey,
    NEURON_API_URL: apiUrl ?? process.env.NEURON_API_URL ?? DEFAULT_API_URL,
  };
  if (mcpClient) env.NEURON_MCP_CLIENT = mcpClient;
  const repoTag = opts ? resolveRepoTag(opts) : undefined;
  if (repoTag) env.NEURON_REPO = repoTag.replace(/^repo:/, '');
  const projectId = opts?.projectId ?? process.env.NEURON_PROJECT_ID;
  if (projectId) env.NEURON_PROJECT_ID = projectId;
  return {
    command: 'npx',
    args: ['-y', NPX_PACKAGE],
    env,
  };
}

function mcpClientForTarget(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes('claude')) return 'claude';
  if (lower.includes('cursor')) return 'cursor';
  return 'other';
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

function writeCursorNeuronRule(repoRoot: string) {
  const rulesDir = join(repoRoot, '.cursor', 'rules');
  const rulePath = join(rulesDir, 'neuron-mcp.mdc');
  mkdirSync(rulesDir, { recursive: true });
  const body = `---
description: Use Neuron MCP cheatsheet at the start of every task when neuron is connected
alwaysApply: true
---

${getAgentInstructions()}
`;
  writeFileSync(rulePath, body);
  return rulePath;
}

function mergeMcpJson(existing: Record<string, unknown>, neuronConfig: unknown) {
  const servers = (existing.mcpServers as Record<string, unknown>) ?? {};
  return { ...existing, mcpServers: { ...servers, neuron: neuronConfig } };
}

function writeMcpConfig(targetPath: string, neuronConfig: unknown) {
  mkdirSync(dirname(targetPath), { recursive: true });
  let existing: Record<string, unknown> = {};
  if (existsSync(targetPath)) {
    existing = JSON.parse(readFileSync(targetPath, 'utf8')) as Record<string, unknown>;
  }
  const merged = mergeMcpJson(existing, neuronConfig);
  writeFileSync(targetPath, `${JSON.stringify(merged, null, 2)}\n`);
}

export async function runInit(argv: string[]): Promise<void> {
  try {
    const { config } = await import('dotenv');
    config();
  } catch {
    /* dotenv optional */
  }

  const opts = parseArgs(argv);
  const apiKey = await resolveApiKey(opts);
  const hasDirect =
    !apiKey &&
    (opts.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    (opts.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    (opts.projectId ?? process.env.NEURON_PROJECT_ID);

  if (opts.stdout) {
    const neuronConfig = apiKey
      ? buildHostedConfig(apiKey, opts.apiUrl, undefined, opts)
      : await buildDirectConfig(opts);
    console.log(JSON.stringify({ mcpServers: { neuron: neuronConfig } }, null, 2));
    return;
  }

  const targets = resolveMcpInstallTargets(opts);
  if (!targets.length) {
    throw new Error('No install targets. Use --cursor and/or --claude (default: both).');
  }

  for (const { label, path } of targets) {
    const neuronConfig = apiKey
      ? buildHostedConfig(apiKey, opts.apiUrl, mcpClientForTarget(label), opts)
      : hasDirect
        ? buildDirectConfig(opts)
        : (() => { throw new Error(missingKeyMessage()); })();
    writeMcpConfig(path, neuronConfig);
    console.log(`✓ ${label} → ${path}`);
  }

  if (opts.project) {
    const rulePath = writeCursorNeuronRule(process.cwd());
    console.log(`✓ Cursor rule → ${rulePath}`);
  }

  console.log('\nRestart your MCP client(s), then confirm "neuron" is connected.');
  console.log('  • Cursor: Settings → MCP');
  console.log('  • Claude Desktop: quit fully and reopen the app');
  console.log('\nFlags: --cursor · --claude · --project (repo-local mcp.json + NEURON_REPO)');
  console.log('       --repo <name> · default installs both Cursor + Claude');
}
