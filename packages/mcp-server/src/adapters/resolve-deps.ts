import type { ContextEngineDeps } from '@neuron/context-engine';
import { createContextEngineDeps } from '@neuron/supabase';
import { createInMemoryDeps } from './in-memory.js';

export function resolveEngineDeps(): ContextEngineDeps {
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (hasSupabase) {
    try {
      const useService = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      return createContextEngineDeps(useService);
    } catch (err) {
      console.error('Supabase connection failed, falling back to in-memory:', err);
    }
  }

  console.error('Neuron MCP: using in-memory store (set Supabase env vars for persistence)');
  return createInMemoryDeps();
}
