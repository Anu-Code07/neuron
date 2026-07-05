'use client';

import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Brain,
  FileText,
  Layers,
  Loader2,
  Plug,
  UserPlus,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewMode } from '@/lib/view-mode';
import { GlassCard, GlassSection } from '@/components/ui/glass-card';
import { HeroFloatingStats } from '@/components/ui/sketch-stat-card';

interface HomeViewProps {
  onAddMemory?: () => void;
}

export function HomeView({ onAddMemory }: HomeViewProps) {
  const { data, isLoading } = useProjectStats();
  const { setViewMode } = useViewMode();

  const memories = data?.memories ?? 0;
  const connections = data?.connections ?? 2;
  const members = data?.members ?? 1;

  const stats = [
    {
      label: 'Memories',
      tagline: 'Facts, decisions & patterns stored',
      value: memories.toLocaleString(),
      icon: Brain,
      tilt: -6,
      delay: 0.1,
      featured: memories > 0,
      iconBg: 'bg-[#FFD6A5]',
    },
    {
      label: 'Sources',
      tagline: 'MCP clients connected',
      value: String(connections),
      icon: Plug,
      tilt: 5,
      delay: 0.2,
      iconBg: 'bg-[#CAFFBF]',
    },
    {
      label: 'Members',
      tagline: 'Active on this project',
      value: String(members),
      icon: Users,
      tilt: -4,
      delay: 0.3,
      iconBg: 'bg-[#BDB2FF]',
    },
    {
      label: 'Packets',
      tagline: 'AI context assembled',
      value: String(data?.packets ?? 0),
      icon: Layers,
      tilt: 7,
      delay: 0.4,
      iconBg: 'bg-[#A2D2FF]',
    },
  ];

  return (
    <div className="custom-scrollbar mx-auto w-full max-w-[1100px] space-y-10 overflow-y-auto p-4 pt-0 md:p-6">
      <section className="relative -mx-2 overflow-hidden rounded-3xl md:-mx-4">
        <div className="page-hero-gradient absolute inset-0" />
        <div className="relative px-2 py-4 md:px-6 md:py-8">
          <HeroFloatingStats
            stats={stats}
            loading={isLoading}
            onDocs={() => setViewMode('docs')}
            onMcp={() => setViewMode('mcp')}
          />
        </div>
      </section>

      <ConnectionsBoard onOpenIntegrations={() => setViewMode('integrations')} onOpenMcp={() => setViewMode('mcp')} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <RecentMemories loading={isLoading} memories={data?.recent ?? []} />
        <GettingStarted
          hasMemory={memories > 0}
          onAddMemory={onAddMemory}
          onOpenMcp={() => setViewMode('mcp')}
          onOpenDocs={() => setViewMode('docs')}
        />
      </div>
    </div>
  );
}

function useProjectStats() {
  return useQuery({
    queryKey: ['project-stats'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: memories, count } = await supabase
        .from('memories')
        .select('id, title, type, created_at', { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

      return {
        memories: count ?? memories?.length ?? 0,
        connections: 2,
        members: 1,
        packets: Math.floor((count ?? 0) / 3),
        recent: memories ?? [],
      };
    },
    staleTime: 30_000,
  });
}

function ConnectionsBoard({
  onOpenIntegrations,
  onOpenMcp,
}: {
  onOpenIntegrations: () => void;
  onOpenMcp: () => void;
}) {
  const integrations = [
    { name: 'Cursor', slug: 'cursor', connected: true },
    { name: 'Claude Desktop', slug: 'claude', connected: false },
    { name: 'VS Code', slug: 'vscode', connected: false },
    { name: 'GitHub', slug: 'github', connected: true },
  ];

  return (
    <GlassSection
      title="Connected sources"
      description="MCP clients and integrations feeding your context engine"
      action={
        <button type="button" onClick={onOpenIntegrations} className="text-[12px] font-medium text-[#4BA0FA] hover:underline">
          View all →
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {integrations.map((item, i) => (
          <GlassCard key={item.slug} padding="sm" delay={i * 0.05} className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/[0.06] text-[#4BA0FA] ring-1 ring-white/10">
              <Plug className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">{item.name}</p>
              <p className={cn('text-[11px]', item.connected ? 'text-emerald-400' : 'text-white/40')}>
                {item.connected ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>
      <button
        type="button"
        onClick={onOpenMcp}
        className="mt-4 w-full rounded-xl border border-dashed border-white/15 py-2.5 text-[12px] text-white/50 transition hover:border-[#4BA0FA]/40 hover:text-[#4BA0FA]"
      >
        + Configure MCP connection
      </button>
    </GlassSection>
  );
}

function RecentMemories({
  loading,
  memories,
}: {
  loading: boolean;
  memories: Array<{ id: string; title: string; type: string; created_at: string }>;
}) {
  return (
    <GlassSection title="Recent memories">
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-[13px] text-white/50">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : memories.length === 0 ? (
        <div className="glass-inner flex items-center gap-4 rounded-xl px-4 py-6">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white/[0.04] text-white/30">
            <FileText className="size-5" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-white">No memories yet</p>
            <p className="mt-0.5 text-[12px] text-white/45">Connect MCP or add a memory — context shows up here.</p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {memories.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex size-8 items-center justify-center rounded-lg bg-white/[0.05] text-white/40">
                <FileText className="size-3.5" />
              </div>
              <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-white">{m.title}</p>
              <span className="glass-pill shrink-0 px-2 py-0.5 text-[10px] text-white/50">{m.type}</span>
            </li>
          ))}
        </ul>
      )}
    </GlassSection>
  );
}

function GettingStarted({
  hasMemory,
  onAddMemory,
  onOpenMcp,
  onOpenDocs,
}: {
  hasMemory: boolean;
  onAddMemory?: () => void;
  onOpenMcp: () => void;
  onOpenDocs: () => void;
}) {
  const steps = [
    { done: true, label: 'Create project', action: null as (() => void) | null },
    { done: false, label: 'Connect MCP client', action: onOpenMcp },
    { done: hasMemory, label: 'Add first memory', action: onAddMemory ?? null },
  ];

  return (
    <GlassCard glow delay={0.2}>
      <p className="mb-4 text-[15px] font-semibold text-white">Getting started</p>
      <ul className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-3">
            <div
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-[11px] font-bold ring-1',
                s.done
                  ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30'
                  : 'bg-white/[0.04] text-white/40 ring-white/10',
              )}
            >
              {s.done ? '✓' : i + 1}
            </div>
            <span className="flex-1 text-[13px] text-white/90">{s.label}</span>
            {s.action && !s.done && (
              <button type="button" onClick={s.action} className="text-[#4BA0FA]">
                <ArrowRight className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onOpenMcp}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#4BA0FA] py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(75,160,250,0.35)] hover:bg-[#4BA0FA]/90"
      >
        <UserPlus className="size-4" /> Set up MCP
      </button>
      <button
        type="button"
        onClick={onOpenDocs}
        className="mt-2 w-full py-2 text-[12px] text-white/45 hover:text-[#4BA0FA]"
      >
        Read the docs →
      </button>
    </GlassCard>
  );
}
