import { NextResponse } from 'next/server';
import { ContextEngine } from '@neuron/context-engine';
import { createContextEngineDeps } from '@neuron/supabase';

export async function POST(request: Request) {
  try {
    const { query, projectId } = await request.json();
    const deps = createContextEngineDeps(true);
    const engine = new ContextEngine(deps);

    const packet = await engine.getProjectContext({
      projectId: projectId ?? process.env.NEURON_PROJECT_ID ?? '00000000-0000-0000-0000-000000000001',
      query: query ?? 'project overview',
      tokenBudget: 4000,
    });

    return NextResponse.json({ packet });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Context fetch failed' },
      { status: 500 },
    );
  }
}
