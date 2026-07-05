import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type NeuronSupabaseClient = SupabaseClient;

export interface SupabaseConfig {
  url: string;
  key: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const mode = process.env.NEURON_SUPABASE_MODE ?? 'cloud';

  if (mode === 'local') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
      key:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        '',
    };
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    key:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      '',
  };
}

export function createNeuronClient(config?: Partial<SupabaseConfig>): NeuronSupabaseClient {
  const resolved = { ...getSupabaseConfig(), ...config };

  if (!resolved.url || !resolved.key) {
    throw new Error(
      'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  return createClient(resolved.url, resolved.key);
}

export function createServiceClient(): NeuronSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for server operations.');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
