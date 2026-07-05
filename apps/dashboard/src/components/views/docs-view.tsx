'use client';

import { useState } from 'react';
import { GlassCard, GlassCodeBlock } from '@/components/ui/glass-card';
import { useViewMode } from '@/lib/view-mode';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  ChevronRight,
  Key,
  Layers,
  Search,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

import {
  buildMcpInstallCommand,
  DEFAULT_NEURON_API_URL,
  MCP_INTERACTIVE_INSTALL,
  MCP_KEY_PLACEHOLDER,
} from '@/lib/mcp-install';

const SECTIONS = [
  { id: 'quickstart', label: 'Quick start', icon: Zap },
  { id: 'auth', label: 'Authentication', icon: Key },
  { id: 'tools', label: 'MCP tools', icon: Terminal },
  { id: 'context', label: 'Context packets', icon: Layers },
  { id: 'search', label: 'Search & memory', icon: Search },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const MCP_TOOLS = [
  { name: 'remember_fact', desc: 'Store factual project knowledge' },
  { name: 'remember_decision', desc: 'Record architectural or product decisions' },
  { name: 'search_memory', desc: 'Hybrid search across all memories' },
  { name: 'get_project_context', desc: 'Assemble an AI-ready context packet' },
  { name: 'summarize_project', desc: 'Generate a compact project brief' },
  { name: 'extract_memories', desc: 'Pull structured memories from a conversation and save them' },
  { name: 'preview_memories', desc: 'Preview memory drafts from a conversation without saving' },
  { name: 'find_duplicates', desc: 'Detect likely duplicate memories with Groq' },
  { name: 'ask_project', desc: 'Ask a question answered from project memories' },
  { name: 'suggest_tags', desc: 'Get Groq-suggested tags for a memory' },
  { name: 'suggest_context', desc: 'Recommend memories to load for a task' },
  { name: 'condense_memories', desc: 'Merge overlapping memories into one' },
  { name: 'suggest_relationships', desc: 'Propose knowledge graph links for a memory' },
  { name: 'extract_from_diff', desc: 'Extract learnings from a git diff' },
];

export function DocsView() {
  const [active, setActive] = useState<SectionId>('quickstart');
  const { setViewMode } = useViewMode();

  return (
    <div className="custom-scrollbar mx-auto flex max-w-6xl flex-1 flex-col gap-6 overflow-y-auto p-4 md:flex-row md:p-6">
      {/* Sidebar */}
      <aside className="md:w-56 md:shrink-0">
        <GlassCard padding="sm" className="md:sticky md:top-4">
          <div className="flex items-center gap-2 px-2 py-1">
            <BookOpen className="size-4 text-[#4BA0FA]" />
            <span className="text-sm font-semibold text-white">Documentation</span>
          </div>
          <nav className="mt-3 space-y-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] transition',
                  active === s.id
                    ? 'bg-[#4BA0FA]/15 text-[#4BA0FA]'
                    : 'text-white/55 hover:bg-white/[0.04] hover:text-white',
                )}
              >
                <s.icon className="size-3.5 shrink-0" />
                {s.label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setViewMode('mcp')}
            className="mt-4 flex w-full items-center justify-between rounded-xl border border-dashed border-white/15 px-3 py-2 text-[12px] text-white/50 hover:border-[#4BA0FA]/40 hover:text-[#4BA0FA]"
          >
            MCP setup wizard
            <ChevronRight className="size-3.5" />
          </button>
        </GlassCard>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="page-hero-gradient mb-6 rounded-3xl px-2 py-6 md:px-4">
          <p className="glass-pill inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-[#4BA0FA]">
            <Sparkles className="size-3" /> v0.1.3
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            {SECTIONS.find((s) => s.id === active)?.label}
          </h1>
        </div>

        {active === 'quickstart' && <QuickstartSection />}
        {active === 'auth' && <AuthSection />}
        {active === 'tools' && <ToolsSection />}
        {active === 'context' && <ContextSection />}
        {active === 'search' && <SearchSection />}
      </div>
    </div>
  );
}

function QuickstartSection() {
  return (
    <div className="space-y-4">
      <GlassCard glow padding="lg">
        <h2 className="text-lg font-semibold text-white">Connect in 60 seconds</h2>
        <p className="mt-2 text-[13px] text-white/50">
          Neuron uses hosted MCP — your team only needs an API key, not Supabase or Groq credentials.
        </p>
        <ol className="mt-5 space-y-4">
          {[
            'MCP Setup → Generate your API key',
            'Copy the one-line install command and run it in terminal',
            'Restart Cursor → Settings → MCP → confirm "neuron" is green',
          ].map((step, i) => (
            <li key={step} className="flex gap-3 text-[13px] text-white/80">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#4BA0FA]/20 text-[11px] font-bold text-[#4BA0FA]">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <GlassCodeBlock
          className="mt-5"
          code={buildMcpInstallCommand(MCP_KEY_PLACEHOLDER)}
        />
        <p className="mt-3 text-[12px] text-white/40">Or run interactively — paste your key when prompted:</p>
        <GlassCodeBlock className="mt-2" code={MCP_INTERACTIVE_INSTALL} />
      </GlassCard>

      <GlassCard padding="lg">
        <h3 className="font-semibold text-white">Test it</h3>
        <p className="mt-2 text-[13px] text-white/50">
          Ask Cursor in natural language:
        </p>
        <GlassCodeBlock
          className="mt-3"
          code={`"Use neuron to remember_fact that our prod URL is neuron-azure.vercel.app"`}
        />
      </GlassCard>
    </div>
  );
}

function AuthSection() {
  return (
    <GlassCard glow padding="lg">
      <h2 className="text-lg font-semibold text-white">NEURON_API_KEY</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-white/50">
        API keys start with <code className="text-[#4BA0FA]">nrn_</code> and map to a single project.
        The hosted backend validates keys via Bearer token and proxies all MCP tool calls server-side.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="glass-inner rounded-xl p-4">
          <p className="text-[12px] font-medium text-white">What customers get</p>
          <ul className="mt-2 space-y-1 text-[12px] text-white/45">
            <li>• One install command with <code className="font-mono">--api-key</code></li>
            <li>• Or paste JSON into Cursor MCP settings</li>
          </ul>
        </div>
        <div className="glass-inner rounded-xl p-4">
          <p className="text-[12px] font-medium text-white">What stays on your server</p>
          <ul className="mt-2 space-y-1 text-[12px] text-white/45">
            <li>• Supabase service role</li>
            <li>• GROQ_API_KEY</li>
            <li>• Project data & RLS</li>
          </ul>
        </div>
      </div>
      <GlassCodeBlock
        className="mt-5"
        code={`curl ${DEFAULT_NEURON_API_URL}/api/mcp \\
  -H "Authorization: Bearer nrn_..."`}
      />
    </GlassCard>
  );
}

function ToolsSection() {
  return (
    <div className="space-y-3">
      {MCP_TOOLS.map((tool, i) => (
        <GlassCard key={tool.name} padding="sm" delay={i * 0.03} className="flex items-center justify-between gap-4">
          <div>
            <code className="text-[13px] font-medium text-[#4BA0FA]">{tool.name}</code>
            <p className="mt-0.5 text-[12px] text-white/45">{tool.desc}</p>
          </div>
        </GlassCard>
      ))}
      <GlassCard padding="md" className="mt-4">
        <p className="text-[12px] text-white/40">
          + remember_pattern, remember_bug, remember_component, remember_api, remember_task,
          remember_architecture, get_task_context, get_file_context, find_related, merge_memory, forget_memory
        </p>
      </GlassCard>
    </div>
  );
}

function ContextSection() {
  return (
    <GlassCard glow padding="lg">
      <h2 className="text-lg font-semibold text-white">Context packets</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-white/50">
        <code className="text-[#4BA0FA]">get_project_context</code> assembles an AI-ready packet:
        relevant memories, architecture summary, open decisions, and bugs — compressed to your token budget.
        Groq enhances the narrative when GROQ_API_KEY is configured on the server.
      </p>
      <GlassCodeBlock
        className="mt-5"
        code={`{
  "tool": "get_project_context",
  "args": {
    "project_id": "uuid",
    "query": "auth flow implementation",
    "token_budget": 4000
  }
}`}
      />
    </GlassCard>
  );
}

function SearchSection() {
  return (
    <GlassCard glow padding="lg">
      <h2 className="text-lg font-semibold text-white">Search & memory</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-white/50">
        Memories are typed (fact, decision, bug, pattern, …) and searchable via keyword + graph traversal.
        Groq reranks results and can extract structured memories from conversation transcripts.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          { title: 'Hybrid search', body: 'Keywords + knowledge graph + optional vector similarity' },
          { title: 'Auto summarize', body: 'Groq generates summaries and tags on remember' },
          { title: 'Duplicate detection', body: 'find_duplicates before merge_memory' },
          { title: 'Active forgetting', body: 'forget_memory marks stale knowledge inactive' },
        ].map((item) => (
          <div key={item.title} className="glass-inner rounded-xl p-4">
            <p className="font-medium text-white">{item.title}</p>
            <p className="mt-1 text-[12px] text-white/45">{item.body}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
