'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { buildMcpInstallCommand } from '@/lib/mcp-install';

const SESSION_KEY = 'neuron_api_key_reveal';
const DEFAULT_PROJECT = process.env.NEXT_PUBLIC_NEURON_PROJECT_ID ?? '';

export type UserApiKeyMeta = {
  id: string;
  name: string;
  key_prefix: string;
  project_id: string;
  last_used_at: string | null;
  created_at: string;
};

type UserApiKeyContextValue = {
  meta: UserApiKeyMeta | null;
  revealedKey: string | null;
  displayKey: string | null;
  hasKey: boolean;
  loading: boolean;
  busy: boolean;
  error: string | null;
  projectId: string;
  generate: () => Promise<string | null>;
  regenerate: () => Promise<string | null>;
  reload: () => Promise<void>;
};

const UserApiKeyContext = createContext<UserApiKeyContextValue | null>(null);

function readSessionKey(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(SESSION_KEY);
}

function writeSessionKey(key: string) {
  sessionStorage.setItem(SESSION_KEY, key);
}

function useUserApiKeyState(projectId = DEFAULT_PROJECT): UserApiKeyContextValue {
  const [meta, setMeta] = useState<UserApiKeyMeta | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/keys?mine=1');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not load API key');
      setMeta(data.key ?? null);
      const cached = readSessionKey();
      if (cached?.startsWith('nrn_')) setRevealedKey(cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load API key');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createOrRegenerate = useCallback(
    async (regenerate = false) => {
      if (!projectId) {
        setError('Project ID is not configured');
        return null;
      }
      setBusy(true);
      setError(null);
      try {
        const res = await fetch('/api/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, regenerate }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Could not create API key');
        writeSessionKey(data.key);
        setRevealedKey(data.key);
        await load();
        return data.key as string;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not create API key');
        return null;
      } finally {
        setBusy(false);
      }
    },
    [projectId, load],
  );

  const displayKey = revealedKey ?? (meta ? `${meta.key_prefix}${'•'.repeat(28)}` : null);

  return {
    meta,
    revealedKey,
    displayKey,
    hasKey: !!meta,
    loading,
    busy,
    error,
    projectId,
    generate: () => createOrRegenerate(false),
    regenerate: () => createOrRegenerate(true),
    reload: load,
  };
}

export function UserApiKeyProvider({
  children,
  projectId = DEFAULT_PROJECT,
}: {
  children: ReactNode;
  projectId?: string;
}) {
  const value = useUserApiKeyState(projectId);
  return <UserApiKeyContext.Provider value={value}>{children}</UserApiKeyContext.Provider>;
}

export function useUserApiKey() {
  const ctx = useContext(UserApiKeyContext);
  if (!ctx) {
    throw new Error('useUserApiKey must be used within UserApiKeyProvider');
  }
  return ctx;
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function getInstallCommandForKey(key: string) {
  return buildMcpInstallCommand(key);
}
