'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { useViewMode } from '@/lib/view-mode';
import {
  ArrowRight,
  Code2,
  GitBranch,
  Globe,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const integrations = [
  {
    id: 'mcp',
    name: 'MCP clients',
    tagline: 'Cursor · Claude · Antigravity · VS Code',
    description: 'One API key works in any MCP-compatible editor. Neuron remembers facts, decisions, and architecture while you code.',
    icon: Terminal,
    status: 'available' as const,
    featured: true,
    color: 'from-[#4BA0FA]/20 to-transparent',
  },
  {
    id: 'claude',
    name: 'Claude Desktop',
    tagline: 'Memory layer for Claude',
    description: 'Persistent project knowledge across every conversation.',
    icon: Code2,
    status: 'available' as const,
    featured: false,
    color: 'from-[#D97757]/15 to-transparent',
  },
  {
    id: 'github',
    name: 'GitHub',
    tagline: 'Repo & PR context',
    description: 'Sync commits, PRs, and release notes into your knowledge graph.',
    icon: GitBranch,
    status: 'available' as const,
    featured: false,
    color: 'from-emerald-500/15 to-transparent',
  },
  {
    id: 'vscode',
    name: 'VS Code',
    tagline: 'MCP extensions',
    description: 'Any MCP-compatible VS Code extension can connect to Neuron.',
    icon: Code2,
    status: 'coming' as const,
    featured: false,
    color: 'from-violet-500/15 to-transparent',
  },
  {
    id: 'chrome',
    name: 'Browser Extension',
    tagline: 'Capture from the web',
    description: 'Save docs, API references, and research into project memory.',
    icon: Globe,
    status: 'coming' as const,
    featured: false,
    color: 'from-cyan-400/15 to-transparent',
  },
];

export function IntegrationsView() {
  const { setViewMode } = useViewMode();
  const featured = integrations.find((i) => i.featured)!;
  const rest = integrations.filter((i) => !i.featured);

  function open(itemId: string) {
    if (itemId === 'mcp' || itemId === 'cursor' || itemId === 'claude') setViewMode('mcp');
  }

  return (
    <div className="custom-scrollbar mx-auto max-w-5xl flex-1 overflow-y-auto p-4 md:p-6">
      <div className="page-hero-gradient rounded-3xl px-1 py-8 md:px-4">
        <p className="glass-pill inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-[#4BA0FA]">
          <Sparkles className="size-3" /> Plug & play
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Connect your AI stack
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-white/50">
          Neuron sits between your tools and your project knowledge. One key, zero Supabase config for your team.
        </p>
      </div>

      {/* Featured integration */}
      <GlassCard glow padding="lg" delay={0.1} className="mt-8 overflow-hidden">
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60', featured.color)} />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08] text-[#4BA0FA] ring-1 ring-white/15">
              <featured.icon className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-white">{featured.name}</h2>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  Recommended
                </span>
              </div>
              <p className="mt-0.5 text-[13px] text-[#4BA0FA]">{featured.tagline}</p>
              <p className="mt-2 max-w-md text-[13px] text-white/55">{featured.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => open(featured.id)}
            className="flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-lg hover:bg-white/90 md:self-center"
          >
            Connect <ArrowRight className="size-4" />
          </button>
        </div>
      </GlassCard>

      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {rest.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => item.status === 'available' && open(item.id)}
            disabled={item.status === 'coming'}
            className="text-left disabled:cursor-not-allowed"
          >
            <GlassCard
              padding="md"
              delay={0.15 + i * 0.05}
              hover={item.status === 'available'}
              className={cn('relative h-full overflow-hidden', item.status === 'coming' && 'opacity-70')}
            >
              <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50', item.color)} />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/[0.06] text-[#4BA0FA] ring-1 ring-white/10">
                    <item.icon className="size-5" />
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      item.status === 'available'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-white/[0.06] text-white/40',
                    )}
                  >
                    {item.status === 'available' ? 'Available' : 'Soon'}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-white">{item.name}</h3>
                <p className="mt-0.5 text-[12px] text-[#4BA0FA]/80">{item.tagline}</p>
                <p className="mt-2 text-[12px] leading-relaxed text-white/45">{item.description}</p>
              </div>
            </GlassCard>
          </button>
        ))}
      </div>

      {/* How it works */}
      <GlassCard glow padding="lg" delay={0.4} className="mt-8">
        <div className="flex items-center gap-2 text-[#4BA0FA]">
          <Zap className="size-4" />
          <span className="text-[12px] font-semibold uppercase tracking-wider">How it works</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { step: '01', title: 'Generate key', body: 'Settings → Generate demo API key. Share with your team.' },
            { step: '02', title: 'Run init', body: 'One npx command writes your MCP config (Cursor, Claude Desktop, etc.).' },
            { step: '03', title: 'Use in your IDE', body: '"Use neuron to remember_fact that our API is …"' },
          ].map((s) => (
            <div key={s.step} className="glass-inner rounded-xl p-4">
              <span className="text-[11px] font-bold text-[#4BA0FA]">{s.step}</span>
              <p className="mt-2 font-medium text-white">{s.title}</p>
              <p className="mt-1 text-[12px] text-white/45">{s.body}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
