import { NextResponse } from 'next/server';
import { createServiceClient } from '@neuron/supabase';
import { ProjectLinkType } from '@neuron/shared';
import { createClient } from '@/lib/supabase/server';
import { resolveAccessibleProjectId } from '@/lib/auth/resolve-project';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const service = createServiceClient();
    await resolveAccessibleProjectId(service, user.id, projectId, projectId);

    const { data, error } = await service
      .from('project_links')
      .select(
        'id, source_project_id, target_project_id, link_type, label, metadata, created_at, updated_at, projects:target_project_id(id, name, slug)',
      )
      .eq('source_project_id', projectId)
      .order('created_at');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ links: data ?? [] });
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

  const { targetProjectId, linkType = ProjectLinkType.DependsOn, label } = await request.json();
  if (!targetProjectId) {
    return NextResponse.json({ error: 'targetProjectId required' }, { status: 400 });
  }

  try {
    const service = createServiceClient();
    await resolveAccessibleProjectId(service, user.id, projectId, projectId);
    await resolveAccessibleProjectId(service, user.id, targetProjectId, targetProjectId);

    const { data, error } = await service
      .from('project_links')
      .insert({
        source_project_id: projectId,
        target_project_id: targetProjectId,
        link_type: linkType,
        label: label ?? null,
      })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ link: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Forbidden' },
      { status: 403 },
    );
  }
}
