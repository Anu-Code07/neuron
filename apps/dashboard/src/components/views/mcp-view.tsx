'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { useViewMode } from '@/lib/view-mode';

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

      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0F1217] text-[#4BA0FA]">
          <Terminal className="size-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#fafafa]">Neuron MCP Server</h2>
          <p className="text-[13px] text-[#737373]">One API key — safe for external demo users</p>
        </div>
      </div>

      <section className="mt-8 sm-card p-5">
        <h3 className="text-[15px] font-semibold text-[#fafafa]">For you (host)</h3>
        <p className="mt-2 text-[12px] text-[#737373]">
          Go to <strong className="text-[#fafafa]">Settings → Generate demo API key</strong>, copy the key, then paste it below to preview the install command you send to testers.
        </p>
        <label className="mt-3 block">
          <span className="text-[12px] text-[#737373]">NEURON_API_KEY preview</span>
          <input
            value={demoKey}
            onChange={(e) => setDemoKey(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#14161A] px-4 py-2.5 text-sm text-[#fafafa] font-mono"
          />
        </label>
      </section>

      <section className="mt-4 sm-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[#fafafa]">Send to your tester</h3>
          <button
            type="button"
            onClick={() => copy(installCmd, 'install')}
            className="flex items-center gap-1.5 rounded-lg bg-[#4BA0FA] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#4BA0FA]/90"
          >
            {copied === 'install' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied === 'install' ? 'Copied!' : 'Copy command'}
          </button>
        </div>
        <p className="mt-2 text-[12px] text-[#737373]">
          They run this once, restart Cursor, and MCP connects to your hosted Neuron backend.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-[#0A0E14] p-4 text-[12px] text-[#8B8B8B] font-mono whitespace-pre-wrap">
          {installCmd}
        </pre>
      </section>

      <section className="mt-4 sm-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[#fafafa]">Or paste config manually</h3>
          <button
            type="button"
            onClick={() => copy(mcpConfig, 'config')}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-[12px] text-[#fafafa] hover:bg-white/10"
          >
            {copied === 'config' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied === 'config' ? 'Copied!' : 'Copy config'}
          </button>
        </div>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-[#0A0E14] p-4 text-[11px] leading-relaxed text-[#8B8B8B] font-mono">
          {mcpConfig}
        </pre>
      </section>

      <section className="mt-4 sm-card p-5">
        <h3 className="text-[15px] font-semibold text-[#fafafa]">Try it in Cursor</h3>
        <p className="mt-2 text-[13px] text-[#737373]">
          Ask: &ldquo;Use neuron to remember_fact that our prod URL is neuron-azure.vercel.app&rdquo;
        </p>
      </section>

      <section className="mt-4 sm-card p-5">
        <h3 className="text-[15px] font-semibold text-[#fafafa]">Tools ({TOOLS.length})</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {TOOLS.map((t) => (
            <span key={t} className="rounded-lg bg-[#0F1217] px-2.5 py-1 text-[11px] font-mono text-[#4BA0FA]">
              {t}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
