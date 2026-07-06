import { NextResponse } from 'next/server';
import { createServiceClient } from '@neuron/supabase';
import { ProjectLinkType } from '@neuron/shared';
import { createClient } from '@/lib/supabase/server';
import { resolveAccessibleProjectId } from '@/lib/auth/resolve-project';

async function assertProjectAccess(userId: string, projectId: string) {
  const service = createServiceClient();
  await resolveAccessibleProjectId(service, userId, projectId, projectId);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await assertProjectAccess(user.id, projectId);
    const service = createServiceClient();
    const { data, error } = await service
      .from('repositories')
      .select('*')
      .eq('project_id', projectId)
      .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ repos: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Forbidden' },
      { status: 403 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, repoSlug, url, defaultBranch } = await request.json();
  if (!name?.trim() || !repoSlug?.trim()) {
    return NextResponse.json({ error: 'name and repoSlug required' }, { status: 400 });
  }

  try {
    await assertProjectAccess(user.id, projectId);
    const service = createServiceClient();
    const { data, error } = await service
      .from('repositories')
      .insert({
        project_id: projectId,
        name: name.trim(),
        repo_slug: repoSlug.trim().toLowerCase(),
        url: url ?? null,
        default_branch: defaultBranch ?? 'main',
        provider: 'local',
      })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ repo: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Forbidden' },
      { status: 403 },
    );
  }
}
