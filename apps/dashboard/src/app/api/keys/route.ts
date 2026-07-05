import { NextResponse } from 'next/server';
import { createServiceClient } from '@neuron/supabase';
import { createClient } from '@/lib/supabase/server';
import { generateApiKey } from '@/lib/auth/api-key';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const service = createServiceClient();
  const { data, error } = await service
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId, name = 'MCP key' } = await request.json();
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const { key, hash, prefix } = generateApiKey();
  const service = createServiceClient();

  const { error } = await service.from('api_keys').insert({
    project_id: projectId,
    name,
    key_hash: hash,
    key_prefix: prefix,
    created_by: user.id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const apiUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://neuron-azure.vercel.app';
  return NextResponse.json({
    key,
    key_prefix: prefix,
    api_url: apiUrl,
    message: 'Copy this key now — it will not be shown again.',
  });
}
