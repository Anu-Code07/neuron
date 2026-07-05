'use client';

import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, FileText, Loader2, Plug, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewMode } from '@/lib/view-mode';

const cardStyle = {
  boxShadow:
    '0 2.842px 14.211px 0 rgba(0, 0, 0, 0.25), 0.711px 0.711px 0.711px 0 rgba(255, 255, 255, 0.10) inset',
};

interface HomeViewProps {
  onAddMemory?: () => void;
}

export function HomeView({ onAddMemory }: HomeViewProps) {
  const { data, isLoading } = useProjectStats();
  const { setViewMode } = useViewMode();

  const memories = data?.memories ?? 0;
  const connections = data?.connections ?? 2;
  const members = data?.members ?? 1;

  return (
    <div className="custom-scrollbar mx-auto w-full max-w-[1080px] space-y-6 overflow-y-auto p-4 pt-2 md:p-6">
      <section
        className="grid grid-cols-2 divide-white/[0.04] rounded-2xl bg-[#1B1F24] sm:grid-cols-4 sm:divide-x"
        style={cardStyle}
      >
        {[
          { label: 'Memories', value: memories.toLocaleString() },
          { label: 'Connected sources', value: String(connections) },
          { label: 'Active members', value: String(members) },
          { label: 'Context packets', value: String(data?.packets ?? 0) },
        ].map((t) => (
          <div key={t.label} className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#737373]">{t.label}</p>
            <p className="mt-1.5 text-[22px] font-semibold leading-none tabular-nums text-[#fafafa]">
              {isLoading ? '—' : t.value}
            </p>
          </div>
        ))}
      </section>

      <ConnectionsBoard onOpenMcp={() => setViewMode('mcp')} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <RecentMemories loading={isLoading} memories={data?.recent ?? []} />
        <GettingStarted
          hasMemory={memories > 0}
          onAddMemory={onAddMemory}
          onOpenMcp={() => setViewMode('mcp')}
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

function ConnectionsBoard({ onOpenMcp }: { onOpenMcp: () => void }) {
  const integrations = [
    { name: 'Cursor', slug: 'cursor', connected: true },
    { name: 'Claude Desktop', slug: 'claude', connected: false },
    { name: 'VS Code', slug: 'vscode', connected: false },
    { name: 'GitHub', slug: 'github', connected: true },
  ];

  return (
    <section className="rounded-[18px] bg-[#1B1F24] p-5" style={cardStyle}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[15px] font-semibold text-[#fafafa]">Connected sources</p>
          <p className="mt-0.5 text-[12px] text-[#737373]">MCP clients and integrations feeding your context engine</p>
        </div>
        <button type="button" onClick={onOpenMcp} className="text-[12px] font-medium text-[#4BA0FA] hover:underline">
          Configure MCP
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {integrations.map((item) => (
          <div key={item.slug} className="sm-tile flex items-center gap-3 p-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#0F1217] text-[#4BA0FA]">
              <Plug className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-[#fafafa]">{item.name}</p>
              <p className={cn('text-[11px]', item.connected ? 'text-emerald-400' : 'text-[#737373]')}>
                {item.connected ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
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
    <section className="min-w-0 rounded-[18px] bg-[#1B1F24] p-5" style={cardStyle}>
      <p className="mb-3 text-[15px] font-semibold text-[#fafafa]">Recent memories</p>
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-[13px] text-[#737373]">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : memories.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-[#14161A] px-4 py-5">
          <div className="flex size-9 items-center justify-center rounded-[10px] bg-[#0F1217] text-[#525D6E]">
            <FileText className="size-4" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#fafafa]">No memories yet</p>
            <p className="mt-0.5 text-[12px] text-[#737373]">Connect MCP or add a memory — context shows up here.</p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.04]">
          {memories.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#0F1217] text-[#737373]">
                <FileText className="size-3.5" />
              </div>
              <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#fafafa]">{m.title}</p>
              <span className="shrink-0 rounded-full bg-[#0F1217] px-2 py-0.5 text-[10px] text-[#737373]">{m.type}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function GettingStarted({
  hasMemory,
  onAddMemory,
  onOpenMcp,
}: {
  hasMemory: boolean;
  onAddMemory?: () => void;
  onOpenMcp: () => void;
}) {
  const steps = [
    { done: true, label: 'Create project', action: null },
    { done: false, label: 'Connect MCP client', action: onOpenMcp },
    { done: hasMemory, label: 'Add first memory', action: onAddMemory },
  ];

  return (
    <section className="rounded-[18px] bg-[#1B1F24] p-5" style={cardStyle}>
      <p className="mb-4 text-[15px] font-semibold text-[#fafafa]">Getting started</p>
      <ul className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-3">
            <div
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-[11px] font-bold',
                s.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#0F1217] text-[#737373]',
              )}
            >
              {s.done ? '✓' : i + 1}
            </div>
            <span className="flex-1 text-[13px] text-[#fafafa]">{s.label}</span>
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
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#4BA0FA] py-2.5 text-sm font-medium text-white hover:bg-[#4BA0FA]/90"
      >
        <UserPlus className="size-4" /> Set up MCP
      </button>
    </section>
  );
}
