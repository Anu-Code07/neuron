'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { useViewMode } from '@/lib/view-mode';
import { useUserApiKey } from '@/lib/hooks/use-user-api-key';
import { ApiKeyPanel } from '@/components/ui/api-key-panel';
import { GlassCard, GlassCodeBlock } from '@/components/ui/glass-card';

const TOOLS = [
  'remember_fact', 'remember_decision', 'remember_pattern', 'remember_bug',
  'remember_component', 'remember_api', 'remember_task', 'remember_architecture',
  'search_memory', 'get_project_context', 'get_task_context', 'get_file_context',
  'find_related', 'summarize_project', 'forget_memory', 'merge_memory',
  'find_duplicates', 'extract_memories',
];

const API_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://neuron-azure.vercel.app';
const PLACEHOLDER = 'nrn_generate_your_key_above';

function buildInstallCmd(apiKey: string) {
  return `NEURON_API_KEY=${apiKey} \\
NEURON_API_URL=${API_URL} \\
npx @anuraghq/neuron-mcp-server init`;
}

function buildMcpConfig(apiKey: string) {
  return JSON.stringify(
    {
      mcpServers: {
        neuron: {
          command: 'npx',
          args: ['-y', '@anuraghq/neuron-mcp-server'],
          env: {
            NEURON_API_KEY: apiKey,
            NEURON_API_URL: API_URL,
          },
        },
      },
    },
    null,
    2,
  );
}

export function McpView() {
  const { setViewMode } = useViewMode();
  const { revealedKey, meta } = useUserApiKey();
  const [copied, setCopied] = useState<'install' | 'config' | null>(null);

  const apiKeyForCmd = revealedKey ?? meta?.key_prefix ?? PLACEHOLDER;
  const canCopyCommands = !!revealedKey;

  const installCmd = useMemo(() => buildInstallCmd(apiKeyForCmd), [apiKeyForCmd]);
  const mcpConfig = useMemo(() => buildMcpConfig(apiKeyForCmd), [apiKeyForCmd]);

  function copy(text: string, key: 'install' | 'config') {
    if (!canCopyCommands) return;
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="custom-scrollbar mx-auto max-w-3xl flex-1 overflow-y-auto p-4 md:p-6">
      <button
        type="button"
        onClick={() => setViewMode('integrations')}
        className="mb-4 text-[13px] text-[#4BA0FA] hover:underline"
      >
        ← Back to integrations
      </button>

      <div className="page-hero-gradient rounded-3xl px-2 py-6">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white/[0.08] text-[#4BA0FA] ring-1 ring-white/15">
            <Terminal className="size-7" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">MCP Setup</h2>
            <p className="text-[13px] text-white/50">One API key per account — safe for external demo users</p>
          </div>
        </div>
      </div>

      <ApiKeyPanel className="mt-6" />

      <GlassCard glow padding="lg" delay={0.1} className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">Send to your tester</h3>
            {!canCopyCommands && (
              <p className="mt-1 text-[12px] text-white/40">
                Generate or regenerate your key above to unlock copy-ready commands.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => copy(installCmd, 'install')}
            disabled={!canCopyCommands}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#4BA0FA] px-4 py-1.5 text-[12px] font-medium text-white hover:bg-[#4BA0FA]/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied === 'install' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied === 'install' ? 'Copied!' : 'Copy command'}
          </button>
        </div>
        <GlassCodeBlock code={installCmd} className="mt-4 whitespace-pre-wrap" />
      </GlassCard>

      <GlassCard padding="lg" delay={0.15} className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-white">Manual config</h3>
          <button
            type="button"
            onClick={() => copy(mcpConfig, 'config')}
            disabled={!canCopyCommands}
            className="glass-pill flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[12px] text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied === 'config' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied === 'config' ? 'Copied!' : 'Copy JSON'}
          </button>
        </div>
        <GlassCodeBlock code={mcpConfig} className="mt-4 text-[11px]" />
      </GlassCard>

      <GlassCard padding="lg" delay={0.2} className="mt-4">
        <h3 className="font-semibold text-white">Tools ({TOOLS.length})</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {TOOLS.map((t) => (
            <span key={t} className="glass-pill px-2.5 py-1 text-[11px] font-mono text-[#4BA0FA]">
              {t}
            </span>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
