'use client';

import { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { useViewMode } from '@/lib/view-mode';
import { UserApiKeyProvider, useUserApiKey } from '@/lib/hooks/use-user-api-key';
import { buildMcpJsonConfig, MCP_KEY_PLACEHOLDER, MCP_MANUAL_CONFIG_HINT } from '@/lib/mcp-install';
import { ApiKeyPanel } from '@/components/ui/api-key-panel';
import { GlassCard, GlassCodeBlock } from '@/components/ui/glass-card';

const TOOLS = [
  'remember_fact', 'remember_decision', 'remember_pattern', 'remember_bug',
  'remember_component', 'remember_api', 'remember_task', 'remember_architecture',
  'search_memory', 'get_project_context', 'get_task_context', 'get_file_context',
  'find_related', 'summarize_project', 'forget_memory', 'merge_memory',
  'find_duplicates', 'extract_memories', 'preview_memories', 'suggest_tags', 'ask_project',
  'suggest_context', 'condense_memories', 'suggest_relationships', 'extract_from_diff',
];

export function McpView() {
  return (
    <UserApiKeyProvider>
      <McpViewContent />
    </UserApiKeyProvider>
  );
}

function McpViewContent() {
  const { setViewMode } = useViewMode();
  const { revealedKey } = useUserApiKey();
  const [copied, setCopied] = useState(false);

  const mcpConfig = buildMcpJsonConfig(revealedKey ?? MCP_KEY_PLACEHOLDER);

  function copyConfig() {
    if (!revealedKey) return;
    navigator.clipboard.writeText(mcpConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <p className="text-[13px] text-white/50">Generate your key, copy the install command, connect your MCP client</p>
          </div>
        </div>
      </div>

      <ApiKeyPanel className="mt-6" showInstallCommands />

      <GlassCard padding="lg" delay={0.15} className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">Manual config</h3>
            <p className="mt-1 text-[12px] text-white/45">
              {MCP_MANUAL_CONFIG_HINT} Works with Cursor, Claude Desktop, Antigravity, and other MCP hosts.
            </p>
          </div>
          <button
            type="button"
            onClick={copyConfig}
            disabled={!revealedKey}
            className="glass-pill flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[12px] text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied!' : 'Copy JSON'}
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
