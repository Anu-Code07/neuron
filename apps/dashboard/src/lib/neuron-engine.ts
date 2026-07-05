import { ContextEngine } from '@neuron/context-engine';
import { createContextEngineDeps } from '@neuron/supabase';

export function getNeuronEngine(projectId?: string) {
  const deps = createContextEngineDeps(true);
  return {
    engine: new ContextEngine(deps),
    projectId: projectId ?? process.env.NEURON_PROJECT_ID ?? '00000000-0000-0000-0000-000000000001',
  };
}
