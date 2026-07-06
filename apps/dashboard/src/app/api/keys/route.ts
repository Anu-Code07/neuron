import { NextResponse } from 'next/server';
import { createServiceClient } from '@neuron/supabase';
import { createClient } from '@/lib/supabase/server';
import { generateApiKey } from '@/lib/auth/api-key';
import { resolveProjectForUser } from '@/lib/auth/resolve-project';

const KEY_FIELDS = 'id, name, key_prefix, project_id, last_used_at, mcp_clients, created_at';

async function getKeyForUserProject(
  service: ReturnType<typeof createServiceClient>,
  userId: string,
  projectId: string,
) {
  const { data } = await service
    .from('api_keys')
    .select(KEY_FIELDS)
    .eq('created_by', userId)
    .eq('project_id', projectId)
    .maybeSingle();
  return data;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const mine = searchParams.get('mine') === '1';
  const projectId = searchParams.get('projectId');

  const service = createServiceClient();

  if (mine) {
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const key = await getKeyForUserProject(service, user.id, projectId);
    if (!key) return NextResponse.json({ key: null });

    const { data: project } = await service
      .from('projects')
      .select('id, name, slug')
      .eq('id', key.project_id)
      .maybeSingle();

    return NextResponse.json({ key: { ...key, project } });
  }

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const { data, error } = await service
    .from('api_keys')
    .select(KEY_FIELDS)
    .eq('project_id', projectId)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId: requestedProjectId, regenerate = false } = await request.json();
  if (!requestedProjectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const service = createServiceClient();
  const existing = await getKeyForUserProject(service, user.id, requestedProjectId);

  let resolvedProjectId: string;
  try {
    resolvedProjectId = await resolveProjectForUser(service, user.id, {
      requestedId: requestedProjectId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not resolve project' },
      { status: 500 },
    );
  }

  if (existing && !regenerate) {
    return NextResponse.json(
      {
        error: 'This project already has an API key. Regenerate to replace it.',
        key: existing,
      },
      { status: 409 },
    );
  }

  if (existing && regenerate) {
    const { error: deleteError } = await service.from('api_keys').delete().eq('id', existing.id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const { key, hash, prefix } = generateApiKey();

  const { error } = await service.from('api_keys').insert({
    project_id: resolvedProjectId,
    name: 'MCP key',
    key_hash: hash,
    key_prefix: prefix,
    created_by: user.id,
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'This project already has an API key. Use regenerate to replace it.' },
        { status: 409 },
      );
    }
    if (error.code === '23503') {
      return NextResponse.json({ error: 'Project not found' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://neuron-azure.vercel.app';
  return NextResponse.json({
    key,
    key_prefix: prefix,
    project_id: resolvedProjectId,
    api_url: apiUrl,
    message: 'Copy this key now — it will not be shown again.',
  });
}
