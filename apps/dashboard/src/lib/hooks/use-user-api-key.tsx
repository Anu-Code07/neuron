'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { buildMcpInstallCommand } from '@/lib/mcp-install';
import { useActiveProject } from '@/lib/hooks/use-active-project';

const SESSION_KEY = 'neuron_api_key_reveal';

export type UserApiKeyMeta = {
  id: string;
  name: string;
  key_prefix: string;
  project_id: string;
  last_used_at: string | null;
  mcp_clients?: Record<string, string>;
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
  generate: () => Promise<string | null>;
  regenerate: () => Promise<string | null>;
  reload: () => Promise<void>;
};

const UserApiKeyContext = createContext<UserApiKeyContextValue | null>(null);

function readSessionKey(projectId: string | null): string | null {
  if (typeof window === 'undefined' || !projectId) return null;
  return sessionStorage.getItem(`${SESSION_KEY}:${projectId}`);
}

function writeSessionKey(projectId: string, key: string) {
  sessionStorage.setItem(`${SESSION_KEY}:${projectId}`, key);
}

function useUserApiKeyState(): UserApiKeyContextValue {
  const { activeProjectId } = useActiveProject();
  const [meta, setMeta] = useState<UserApiKeyMeta | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeProjectId) {
      setMeta(null);
      setRevealedKey(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/keys?mine=1&projectId=${activeProjectId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not load API key');
      setMeta(data.key ?? null);
      const cached = readSessionKey(activeProjectId);
      if (cached?.startsWith('nrn_')) setRevealedKey(cached);
      else setRevealedKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load API key');
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const createOrRegenerate = useCallback(
    async (regenerate = false) => {
      if (!activeProjectId) return null;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch('/api/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: activeProjectId, regenerate }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Could not create API key');
        writeSessionKey(activeProjectId, data.key);
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
    [activeProjectId, load],
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
    generate: () => createOrRegenerate(false),
    regenerate: () => createOrRegenerate(true),
    reload: load,
  };
}

export function UserApiKeyProvider({ children }: { children: ReactNode }) {
  const value = useUserApiKeyState();
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

export function getInstallCommandForKey(key: string, repoSlug?: string) {
  return buildMcpInstallCommand(key, repoSlug);
}
