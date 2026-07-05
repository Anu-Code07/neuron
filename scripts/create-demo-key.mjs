#!/usr/bin/env node
/**
 * Mint a NEURON_API_KEY for external demo/test users.
 * Usage: node scripts/create-demo-key.mjs [--name "Demo user"] [--project-id UUID]
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in env
 * (loads apps/dashboard/.env.local if present).
 */
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const envPath = join(root, 'apps/dashboard/.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  let name = 'External demo';
  let projectId;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name') name = args[++i];
    if (args[i] === '--project-id') projectId = args[++i];
  }
  if (!projectId) {
    const envProject =
      process.env.NEURON_PROJECT_ID ?? process.env.NEXT_PUBLIC_NEURON_PROJECT_ID;
    const placeholder = '00000000-0000-0000-0000-000000000001';
    if (envProject && envProject !== placeholder) projectId = envProject;
  }
  return { name, projectId };
}

function hashKey(key) {
  return createHash('sha256').update(key).digest('hex');
}

loadEnv();
const { name, projectId: argProjectId } = parseArgs();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PRODUCTION_URL = 'https://neuron-azure.vercel.app';
const apiUrl =
  process.env.DEMO_API_URL ??
  (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')
    ? PRODUCTION_URL
    : process.env.NEXT_PUBLIC_APP_URL ?? PRODUCTION_URL);

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

async function rest(path, opts = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, { ...opts, headers: { ...headers, ...opts.headers } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function rpc(fn, body) {
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`rpc ${fn}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function ensureDemoProject(ownerId) {
  let orgs = await rest('organizations?select=id&limit=1');
  let orgId = orgs?.[0]?.id;

  if (!orgId) {
    const created = await rest('organizations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Neuron Demo',
        slug: 'neuron-demo',
        owner_id: ownerId,
      }),
    });
    orgId = created[0].id;
    await rest('organization_members', {
      method: 'POST',
      body: JSON.stringify({
        organization_id: orgId,
        user_id: ownerId,
        role: 'owner',
      }),
    });
    console.log(`Created organization: Neuron Demo (${orgId})`);
  }

  let projects = await rest(`projects?organization_id=eq.${orgId}&select=id,name&limit=1`);
  if (projects?.length) return projects[0].id;

  const created = await rest('projects', {
    method: 'POST',
    body: JSON.stringify({
      organization_id: orgId,
      name: 'Demo Project',
      slug: 'demo',
      description: 'Shared sandbox for external demo users',
    }),
  });
  console.log(`Created project: Demo Project (${created[0].id})`);
  return created[0].id;
}

async function main() {
  // Probe RPC (empty result = ok; 404 = migration missing)
  const probe = await fetch(`${url}/rest/v1/rpc/verify_api_key`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ raw_key: 'nrn_probe' }),
  });
  const probeBody = await probe.text();
  if (probe.status === 404 && probeBody.includes('does not exist')) {
    console.error('Run migration first: supabase db push');
    process.exit(1);
  }
  if (probe.status >= 500) {
    console.error('verify_api_key error:', probeBody);
    process.exit(1);
  }

  let projectId = argProjectId;

  const profiles = await rest('profiles?select=id,email&limit=1');
  if (!profiles?.length) {
    console.error('No user profiles found. Sign up once at the dashboard so a profile exists.');
    process.exit(1);
  }
  const createdBy = profiles[0].id;

  const existingKeys = await rest(`api_keys?created_by=eq.${createdBy}&select=id`);
  if (existingKeys?.length) {
    await rest(`api_keys?created_by=eq.${createdBy}`, { method: 'DELETE' });
    console.log('Replaced existing API key for user (one key per user).');
  }

  if (projectId) {
    const projects = await rest(`projects?id=eq.${projectId}&select=id,name`);
    if (!projects?.length) {
      console.error(`Project ${projectId} not found. Omit --project-id to auto-create a demo project.`);
      process.exit(1);
    }
  } else {
    const projects = await rest('projects?select=id,name&order=created_at.asc&limit=1');
    if (projects?.length) {
      projectId = projects[0].id;
      console.log(`Using project: ${projects[0].name} (${projectId})`);
    } else {
      projectId = await ensureDemoProject(createdBy);
    }
  }

  const key = `nrn_${randomBytes(24).toString('hex')}`;
  const prefix = key.slice(0, 12);

  await rest('api_keys', {
    method: 'POST',
    body: JSON.stringify({
      project_id: projectId,
      name,
      key_hash: hashKey(key),
      key_prefix: prefix,
      created_by: createdBy,
    }),
  });

  const initCmd = `NEURON_API_KEY=${key} NEURON_API_URL=${apiUrl} npx @anuraghq/neuron-mcp-server init`;

  const mcpJson = JSON.stringify(
    {
      mcpServers: {
        neuron: {
          command: 'npx',
          args: ['-y', '@anuraghq/neuron-mcp-server'],
          env: {
            NEURON_API_KEY: key,
            NEURON_API_URL: apiUrl,
          },
        },
      },
    },
    null,
    2,
  );

  console.log('\n✓ Demo API key created\n');
  console.log('Share with your tester (key shown once):\n');
  console.log(`  NEURON_API_KEY=${key}`);
  console.log(`  NEURON_API_URL=${apiUrl}`);
  console.log('\nOne-command install:\n');
  console.log(`  ${initCmd}`);
  console.log('\nOr paste into ~/.cursor/mcp.json:\n');
  console.log(mcpJson);
  console.log('\nThen restart Cursor → Settings → MCP.');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
