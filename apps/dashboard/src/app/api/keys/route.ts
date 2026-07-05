import { NextResponse } from 'next/server';
import { createServiceClient } from '@neuron/supabase';
import { createClient } from '@/lib/supabase/server';
import { generateApiKey } from '@/lib/auth/api-key';

const KEY_FIELDS = 'id, name, key_prefix, project_id, last_used_at, created_at';

async function getExistingKeyForUser(service: ReturnType<typeof createServiceClient>, userId: string) {
  const { data } = await service
    .from('api_keys')
    .select(KEY_FIELDS)
    .eq('created_by', userId)
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
    const key = await getExistingKeyForUser(service, user.id);
    return NextResponse.json({ key });
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

  const { projectId, regenerate = false } = await request.json();
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const service = createServiceClient();
  const existing = await getExistingKeyForUser(service, user.id);

  if (existing && !regenerate) {
    return NextResponse.json(
      {
        error: 'You already have an API key. Regenerate to create a new one (the old key will stop working).',
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
    project_id: projectId,
    name: 'Personal MCP key',
    key_hash: hash,
    key_prefix: prefix,
    created_by: user.id,
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'You already have an API key. Use regenerate to replace it.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://neuron-azure.vercel.app';
  return NextResponse.json({
    key,
    key_prefix: prefix,
    api_url: apiUrl,
    message: 'Copy this key now — it will not be shown again.',
  });
}
