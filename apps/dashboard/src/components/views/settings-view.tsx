'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function SettingsView() {
  const [email, setEmail] = useState<string | null>(null);
  const [projectId, setProjectId] = useState(process.env.NEXT_PUBLIC_NEURON_PROJECT_ID ?? '');

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  return (
    <div className="mx-auto max-w-2xl flex-1 p-4 md:p-6">
      <h2 className="text-xl font-semibold text-[#fafafa]">Settings</h2>
      <p className="mt-1 text-[13px] text-[#737373]">Account and project configuration</p>

      <div className="mt-8 space-y-4">
        <SettingsSection title="Account">
          <SettingsRow label="Email" value={email ?? '—'} />
        </SettingsSection>

        <SettingsSection title="Supabase">
          <SettingsRow label="URL" value={process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'Not set'} />
          <SettingsRow label="Mode" value="Cloud" />
        </SettingsSection>

        <SettingsSection title="MCP">
          <label className="block">
            <span className="text-[12px] text-[#737373]">Project ID (for MCP tools)</span>
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#14161A] px-4 py-2.5 text-sm text-[#fafafa]"
              placeholder="00000000-0000-0000-0000-000000000001"
            />
          </label>
          <p className="mt-2 text-[11px] text-[#737373]">
            Set NEURON_PROJECT_ID in your MCP env to match this UUID.
          </p>
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
