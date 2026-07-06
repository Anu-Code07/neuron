import { NextResponse } from 'next/server';
import { createServiceClient } from '@neuron/supabase';
import { createClient } from '@/lib/supabase/server';
import {
  createUserProject,
  listUserProjects,
} from '@/lib/auth/resolve-project';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();
  try {
    const projects = await listUserProjects(service, user.id);
    return NextResponse.json({ projects });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not load projects' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, slug } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
  }

  const service = createServiceClient();
  try {
    const project = await createUserProject(service, user.id, { name: name.trim(), slug });
    return NextResponse.json({ project });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not create project' },
      { status: 500 },
    );
  }
}
