'use client';

import { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { useViewMode } from '@/lib/view-mode';

const MCP_CONFIG = `{
  "mcpServers": {
    "neuron": {
      "command": "node",
      "args": ["${typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_MCP_SERVER_PATH ?? '/path/to/neuron/packages/mcp-server/dist/index.js' : '/path/to/neuron/packages/mcp-server/dist/index.js'}"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": "your-publishable-key",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "NEURON_PROJECT_ID": "your-project-uuid"
      }
    }
  }
}`;

const TOOLS = [
  'remember_fact', 'remember_decision', 'remember_pattern', 'remember_bug',
  'remember_component', 'remember_api', 'remember_task', 'remember_architecture',
  'search_memory', 'get_project_context', 'get_task_context', 'get_file_context',
  'find_related', 'summarize_project', 'forget_memory', 'merge_memory',
];

export function McpView() {
  const { setViewMode } = useViewMode();
  const [copied, setCopied] = useState(false);

  function copyConfig() {
    navigator.clipboard.writeText(MCP_CONFIG);
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

      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0F1217] text-[#4BA0FA]">
          <Terminal className="size-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#fafafa]">Neuron MCP Server</h2>
          <p className="text-[13px] text-[#737373]">Context Engine for any MCP-compatible AI assistant</p>
        </div>
      </div>

      <section className="mt-8 sm-card p-5">
        <h3 className="text-[15px] font-semibold text-[#fafafa]">1. Build the server</h3>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-[#0A0E14] p-4 text-[12px] text-[#8B8B8B] font-mono">
{`cd neuron
pnpm install
pnpm --filter @neuron/mcp-server build`}
        </pre>
      </section>

      <section className="mt-4 sm-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[#fafafa]">2. Add to Cursor</h3>
          <button
            type="button"
            onClick={copyConfig}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-[12px] text-[#fafafa] hover:bg-white/10"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied!' : 'Copy config'}
          </button>
        </div>
        <p className="mt-2 text-[12px] text-[#737373]">
          Paste into <code className="text-[#4BA0FA]">~/.cursor/mcp.json</code> or project <code className="text-[#4BA0FA]">.cursor/mcp.json</code>
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-[#0A0E14] p-4 text-[11px] leading-relaxed text-[#8B8B8B] font-mono">
          {MCP_CONFIG}
        </pre>
      </section>

      <section className="mt-4 sm-card p-5">
        <h3 className="text-[15px] font-semibold text-[#fafafa]">Available tools ({TOOLS.length})</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {TOOLS.map((t) => (
            <span key={t} className="rounded-lg bg-[#0F1217] px-2.5 py-1 text-[11px] font-mono text-[#4BA0FA]">
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-4 sm-card p-5">
        <h3 className="text-[15px] font-semibold text-[#fafafa]">3. Test it</h3>
        <p className="mt-2 text-[13px] text-[#737373]">
          Ask Cursor: &ldquo;Use neuron to get_project_context for this project&rdquo;
        </p>
      </section>
    </div>
  );
}
