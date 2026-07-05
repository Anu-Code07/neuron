'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { useViewMode } from '@/lib/view-mode';
import { GlassCard, GlassCodeBlock, GlassSection } from '@/components/ui/glass-card';

const TOOLS = [
  'remember_fact', 'remember_decision', 'remember_pattern', 'remember_bug',
  'remember_component', 'remember_api', 'remember_task', 'remember_architecture',
  'search_memory', 'get_project_context', 'get_task_context', 'get_file_context',
  'find_related', 'summarize_project', 'forget_memory', 'merge_memory',
  'find_duplicates', 'extract_memories',
];

const API_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://neuron-azure.vercel.app';

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
  const [copied, setCopied] = useState<'install' | 'config' | null>(null);
  const [demoKey, setDemoKey] = useState('nrn_your_key_from_dashboard_settings');

  const installCmd = useMemo(() => buildInstallCmd(demoKey), [demoKey]);
  const mcpConfig = useMemo(() => buildMcpConfig(demoKey), [demoKey]);

  function copy(text: string, key: 'install' | 'config') {
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
            <p className="text-[13px] text-white/50">One API key — safe for external demo users</p>
          </div>
        </div>
      </div>

      <GlassSection
        title="Generate your key"
        description="Settings → Generate demo API key, then paste below to preview the install command."
        className="mt-6"
      >
        <label className="block">
          <span className="text-[12px] text-white/45">NEURON_API_KEY preview</span>
          <input
            value={demoKey}
            onChange={(e) => setDemoKey(e.target.value)}
            className="glass-inner mt-2 w-full rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none focus:ring-1 focus:ring-[#4BA0FA]/50"
          />
        </label>
      </GlassSection>

      <GlassCard glow padding="lg" delay={0.1} className="mt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Send to your tester</h3>
          <button
            type="button"
            onClick={() => copy(installCmd, 'install')}
            className="flex items-center gap-1.5 rounded-full bg-[#4BA0FA] px-4 py-1.5 text-[12px] font-medium text-white hover:bg-[#4BA0FA]/90"
          >
            {copied === 'install' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied === 'install' ? 'Copied!' : 'Copy command'}
          </button>
        </div>
        <GlassCodeBlock code={installCmd} className="mt-4 whitespace-pre-wrap" />
      </GlassCard>

      <GlassCard padding="lg" delay={0.15} className="mt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Manual config</h3>
          <button
            type="button"
            onClick={() => copy(mcpConfig, 'config')}
            className="glass-pill flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-white hover:bg-white/10"
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
