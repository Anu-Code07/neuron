import type { createServiceClient } from '@neuron/supabase';

type ServiceClient = ReturnType<typeof createServiceClient>;

function envProjectId(): string | undefined {
  const id = process.env.NEURON_PROJECT_ID ?? process.env.NEXT_PUBLIC_NEURON_PROJECT_ID;
  if (!id || id === '00000000-0000-0000-0000-000000000001') return undefined;
  return id;
}

async function projectExists(service: ServiceClient, projectId: string): Promise<boolean> {
  const { data } = await service.from('projects').select('id').eq('id', projectId).maybeSingle();
  return !!data;
}

async function getMemberProject(service: ServiceClient, userId: string): Promise<string | null> {
  const { data } = await service
    .from('project_members')
    .select('project_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.project_id ?? null;
}

async function ensureProjectMember(service: ServiceClient, projectId: string, userId: string) {
  const { data } = await service
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();
  if (data) return;

  await service.from('project_members').insert({
    project_id: projectId,
    user_id: userId,
    role: 'editor',
  });
}

async function provisionPersonalProject(service: ServiceClient, userId: string): Promise<string> {
  const { data: profile } = await service
    .from('profiles')
    .select('email, display_name')
    .eq('id', userId)
    .single();

  const suffix = userId.slice(0, 8);
  const display = profile?.display_name ?? profile?.email?.split('@')[0] ?? 'Personal';

  const { data: org, error: orgError } = await service
    .from('organizations')
    .insert({
      name: `${display}'s workspace`,
      slug: `org-${suffix}`,
      owner_id: userId,
    })
    .select('id')
    .single();

  if (orgError || !org) {
    throw new Error(orgError?.message ?? 'Could not create organization');
  }

  await service.from('organization_members').insert({
    organization_id: org.id,
    user_id: userId,
    role: 'owner',
  });

  const { data: project, error: projectError } = await service
    .from('projects')
    .insert({
      organization_id: org.id,
      name: 'My Project',
      slug: `default-${suffix}`,
      description: 'Auto-created for Neuron MCP',
    })
    .select('id')
    .single();

  if (projectError || !project) {
    throw new Error(projectError?.message ?? 'Could not create project');
  }

  await service.from('project_members').insert({
    project_id: project.id,
    user_id: userId,
    role: 'owner',
  });

  return project.id;
}

/** Resolve a real projects.id for API key creation — never trust client/env blindly */
export async function resolveProjectForUser(
  service: ServiceClient,
  userId: string,
  options?: { requestedId?: string; existingKeyProjectId?: string },
): Promise<string> {
  const candidates = [
    options?.existingKeyProjectId,
    options?.requestedId,
    envProjectId(),
    await getMemberProject(service, userId),
  ].filter((id): id is string => !!id);

  for (const id of candidates) {
    if (await projectExists(service, id)) {
      await ensureProjectMember(service, id, userId);
      return id;
    }
  }

  return provisionPersonalProject(service, userId);
}
