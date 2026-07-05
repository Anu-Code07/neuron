'use client';

import { createClient } from '@/lib/supabase/client';
import { Check, Copy, KeyRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://neuron-azure.vercel.app';
const DEFAULT_PROJECT = process.env.NEXT_PUBLIC_NEURON_PROJECT_ID ?? '';

export function SettingsView() {
  const [email, setEmail] = useState<string | null>(null);
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [existingKeys, setExistingKeys] = useState<Array<{ id: string; name: string; key_prefix: string; last_used_at: string | null }>>([]);

  const loadKeys = useCallback(async () => {
    if (!projectId) return;
    const res = await fetch(`/api/keys?projectId=${projectId}`);
    if (res.ok) {
      const data = await res.json();
      setExistingKeys(data.keys ?? []);
    }
  }, [projectId]);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  async function generateKey() {
    if (!projectId) return;
    setLoading(true);
    setNewKey(null);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name: 'External demo' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setNewKey(data.key);
      await loadKeys();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create key');
    } finally {
      setLoading(false);
    }
  }

  function copyHandoff() {
    if (!newKey) return;
    const text = [
      `NEURON_API_KEY=${newKey}`,
      `NEURON_API_URL=${API_URL}`,
      '',
      'Install in Cursor:',
      `NEURON_API_KEY=${newKey} NEURON_API_URL=${API_URL} npx @anuraghq/neuron-mcp-server init`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl flex-1 p-4 md:p-6">
      <h2 className="text-xl font-semibold text-[#fafafa]">Settings</h2>
      <p className="mt-1 text-[13px] text-[#737373]">Account and MCP access for demo users</p>

      <div className="mt-8 space-y-4">
        <SettingsSection title="Account">
          <SettingsRow label="Email" value={email ?? '—'} />
        </SettingsSection>

        <SettingsSection title="Demo / MCP API key">
          <p className="text-[12px] text-[#737373]">
            Share a single key with external testers. They never see your Supabase or Groq credentials.
          </p>
          <label className="mt-3 block">
            <span className="text-[12px] text-[#737373]">Project ID</span>
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#14161A] px-4 py-2.5 text-sm text-[#fafafa] font-mono"
              placeholder="project uuid"
            />
          </label>
          <button
            type="button"
            onClick={generateKey}
            disabled={loading || !projectId}
            className="mt-3 flex items-center gap-2 rounded-xl bg-[#4BA0FA] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#4BA0FA]/90 disabled:opacity-50"
          >
            <KeyRound className="size-4" />
            {loading ? 'Creating…' : 'Generate demo API key'}
          </button>

          {newKey && (
            <div className="mt-4 rounded-xl border border-[#4BA0FA]/30 bg-[#4BA0FA]/5 p-4">
              <p className="text-[12px] font-medium text-[#4BA0FA]">Copy now — shown once</p>
              <code className="mt-2 block break-all text-[11px] text-[#fafafa]">{newKey}</code>
              <button
                type="button"
                onClick={copyHandoff}
                className="mt-3 flex items-center gap-1.5 text-[12px] text-[#4BA0FA] hover:underline"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? 'Copied handoff!' : 'Copy full handoff for tester'}
              </button>
            </div>
          )}

          {existingKeys.length > 0 && (
            <ul className="mt-4 space-y-2">
              {existingKeys.map((k) => (
                <li key={k.id} className="flex justify-between text-[12px] text-[#737373]">
                  <span>{k.name} · {k.key_prefix}…</span>
                  <span>{k.last_used_at ? `Used ${new Date(k.last_used_at).toLocaleDateString()}` : 'Never used'}</span>
                </li>
              ))}
            </ul>
          )}
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="sm-card p-5">
      <h3 className="mb-4 text-[15px] font-semibold text-[#fafafa]">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-[#737373]">{label}</span>
      <span className="max-w-[60%] truncate text-[#fafafa]">{value}</span>
    </div>
  );
}
