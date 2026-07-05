'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { useViewMode } from '@/lib/view-mode';
import { useUserApiKey } from '@/lib/hooks/use-user-api-key';
import {
  buildMcpInstallCommand,
  buildMcpJsonConfig,
  MCP_INTERACTIVE_INSTALL,
  MCP_KEY_PLACEHOLDER,
} from '@/lib/mcp-install';
import { ApiKeyPanel } from '@/components/ui/api-key-panel';
import { GlassCard, GlassCodeBlock } from '@/components/ui/glass-card';

const TOOLS = [
  'remember_fact', 'remember_decision', 'remember_pattern', 'remember_bug',
  'remember_component', 'remember_api', 'remember_task', 'remember_architecture',
  'search_memory', 'get_project_context', 'get_task_context', 'get_file_context',
  'find_related', 'summarize_project', 'forget_memory', 'merge_memory',
  'find_duplicates', 'extract_memories',
];

export function McpView() {
  const { setViewMode } = useViewMode();
  const { revealedKey } = useUserApiKey();
  const [copied, setCopied] = useState<'install' | 'interactive' | 'config' | null>(null);

  const canCopyCommands = !!revealedKey;
  const installCmd = useMemo(
    () => buildMcpInstallCommand(revealedKey ?? MCP_KEY_PLACEHOLDER),
    [revealedKey],
  );
  const mcpConfig = useMemo(
    () => buildMcpJsonConfig(revealedKey ?? MCP_KEY_PLACEHOLDER),
    [revealedKey],
  );

  function copy(text: string, key: 'install' | 'interactive' | 'config') {
    if (key !== 'interactive' && !canCopyCommands) return;
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
            <p className="text-[13px] text-white/50">One command to connect Cursor — Mac, Windows, or Linux</p>
          </div>
        </div>
      </div>

      <ApiKeyPanel className="mt-6" />

      <GlassCard glow padding="lg" delay={0.1} className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4BA0FA]">
              Recommended
            </p>
            <h3 className="mt-1 font-semibold text-white">Copy & run in terminal</h3>
            <p className="mt-1 text-[12px] text-white/45">
              Paste in Terminal (Mac/Linux) or PowerShell (Windows). Then restart Cursor.
            </p>
            {!canCopyCommands && (
              <p className="mt-2 text-[12px] text-amber-200/80">
                Generate your key above first — the command will include your real key.
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
        <GlassCodeBlock code={installCmd} className="mt-4 text-[12px]" />
      </GlassCard>

      <GlassCard padding="lg" delay={0.12} className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
              No flags
            </p>
            <h3 className="mt-1 font-semibold text-white">Interactive setup</h3>
            <p className="mt-1 text-[12px] text-white/45">
              Run this, then paste your <code className="font-mono text-white/60">nrn_</code> key when asked.
            </p>
          </div>
          <button
            type="button"
            onClick={() => copy(MCP_INTERACTIVE_INSTALL, 'interactive')}
            className="glass-pill flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[12px] text-white hover:bg-white/10"
          >
            {copied === 'interactive' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied === 'interactive' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <GlassCodeBlock code={MCP_INTERACTIVE_INSTALL} className="mt-4 text-[12px]" />
      </GlassCard>

      <GlassCard padding="lg" delay={0.15} className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">Manual config</h3>
            <p className="mt-1 text-[12px] text-white/45">
              No terminal — paste into Cursor → Settings → MCP → Edit config.
            </p>
          </div>
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
