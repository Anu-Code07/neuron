'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { ApiKeyPanel } from '@/components/ui/api-key-panel';
import { UserApiKeyProvider } from '@/lib/hooks/use-user-api-key';

export function SettingsView() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  return (
    <div className="mx-auto max-w-2xl flex-1 p-4 md:p-6">
      <h2 className="text-xl font-semibold text-[#fafafa]">Settings</h2>
      <p className="mt-1 text-[13px] text-[#737373]">Account and MCP access</p>

      <div className="mt-8 space-y-4">
        <SettingsSection title="Account">
          <SettingsRow label="Email" value={email ?? '—'} />
        </SettingsSection>

        <UserApiKeyProvider>
          <ApiKeyPanel compact />
        </UserApiKeyProvider>
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
