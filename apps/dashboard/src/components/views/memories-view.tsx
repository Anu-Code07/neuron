'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Network,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemoriesList, type GraphMemory } from '@/lib/hooks/use-knowledge-graph';
import { getMemoryTypeMeta } from '@/lib/memory-theme';
import { useViewMode } from '@/lib/view-mode';

export function MemoriesView() {
  const { data, isLoading, refetch } = useMemoriesList();
  const { setViewMode } = useViewMode();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const memories = data ?? [];

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of memories) {
      counts[m.type] = (counts[m.type] ?? 0) + 1;
    }
    return counts;
  }, [memories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return memories.filter((m) => {
      if (typeFilter && m.type !== typeFilter) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [memories, search, typeFilter]);

  const sortedTypes = useMemo(
    () => Object.entries(typeCounts).sort((a, b) => b[1] - a[1]),
    [typeCounts],
  );

  return (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
      <div className="relative overflow-hidden px-4 pb-6 pt-2 md:px-6 md:pt-4">
        <div className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-[#4BA0FA]/10 blur-3xl" />
        <div className="pointer-events-none absolute left-1/4 top-40 h-48 w-48 rounded-full bg-[#36FDFD]/5 blur-3xl" />

        <header className="relative mb-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4BA0FA]">
              Knowledge base
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Memories
            </h2>
            <p className="mt-1 text-[13px] text-white/45">
              {memories.length} structured items across your project
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="glass relative flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
              <Search className="size-4 shrink-0 text-white/35" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search titles, content, tags…"
                className="w-full bg-transparent text-[13px] text-white placeholder:text-white/30 outline-none"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="text-white/40 hover:text-white">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setViewMode('graph')}
              className="glass-hover flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium text-[#4BA0FA] transition"
            >
              <Network className="size-4" />
              View graph
            </button>
          </motion.div>

          {sortedTypes.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-4 flex flex-wrap gap-2"
            >
              <FilterChip
                active={!typeFilter}
                label={`All ${memories.length}`}
                onClick={() => setTypeFilter(null)}
              />
              {sortedTypes.map(([type, count]) => {
                const meta = getMemoryTypeMeta(type);
                return (
                  <FilterChip
                    key={type}
                    active={typeFilter === type}
                    label={`${meta.label} ${count}`}
                    color={meta.color}
                    onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                  />
                );
              })}
            </motion.div>
          )}
        </header>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="glass flex flex-col items-center gap-3 rounded-2xl px-10 py-8">
              <Loader2 className="size-7 animate-spin text-[#4BA0FA]" />
              <p className="text-sm text-white/45">Loading memories…</p>
            </div>
          </div>
        ) : !memories.length ? (
          <EmptyMemories onOpenMcp={() => setViewMode('mcp')} />
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-white/60">No memories match your search.</p>
            <button
              type="button"
              onClick={() => { setSearch(''); setTypeFilter(null); }}
              className="mt-2 text-sm text-[#4BA0FA] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <motion.div
            layout
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((m, i) => (
                <MemoryCard
                  key={m.id}
                  memory={m}
                  index={i}
                  onDelete={() => refetch()}
                  onViewGraph={() => setViewMode('graph')}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-[11px] font-medium transition',
        active
          ? 'bg-[#4BA0FA]/20 text-[#4BA0FA] ring-1 ring-[#4BA0FA]/40'
          : 'bg-white/[0.04] text-white/50 ring-1 ring-white/10 hover:bg-white/[0.08] hover:text-white/80',
      )}
      style={active && color ? { color, background: `${color}18`, borderColor: `${color}40` } : undefined}
    >
      {label}
    </button>
  );
}

function MemoryCard({
  memory,
  index,
  onDelete,
  onViewGraph,
}: {
  memory: GraphMemory;
  index: number;
  onDelete: () => void;
  onViewGraph: () => void;
}) {
  const meta = getMemoryTypeMeta(memory.type);
  const Icon = meta.icon;

  async function handleDelete() {
    const supabase = createClient();
    await supabase.from('memories').update({ status: 'forgotten' }).eq('id', memory.id);
    onDelete();
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(145deg, rgba(20,22,26,0.95) 0%, rgba(10,14,20,0.98) 100%)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: `linear-gradient(180deg, ${meta.color}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: meta.glow }}
      />

      <div className="relative p-4 pl-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-8 items-center justify-center rounded-lg ring-1"
              style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
            >
              <Icon className="size-3.5" />
            </div>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={onViewGraph}
              title="View in graph"
              className="rounded-lg p-1.5 text-white/35 hover:bg-white/10 hover:text-[#4BA0FA]"
            >
              <Network className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg p-1.5 text-white/35 hover:bg-red-500/15 hover:text-red-400"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        <h3 className="text-[15px] font-semibold leading-snug text-white">{memory.title}</h3>
        <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-white/50">
          {memory.content}
        </p>

        {memory.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {memory.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/45 ring-1 ring-white/[0.06]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-2">
          <MetricBar label="Confidence" value={memory.confidence} color={meta.color} />
          <MetricBar label="Importance" value={memory.importance} color="#36FDFD" />
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-white/35">
          <span className="capitalize">{memory.layer} layer</span>
          <span>{new Date(memory.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.article>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[10px] text-white/35">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full"
          style={{ width: `${value * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

function EmptyMemories({ onOpenMcp }: { onOpenMcp: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="glass relative flex size-20 items-center justify-center rounded-3xl">
        <div className="absolute inset-0 animate-pulse rounded-3xl bg-[#4BA0FA]/10 blur-xl" />
        <Search className="relative size-9 text-[#4BA0FA]/80" />
      </div>
      <p className="mt-6 text-xl font-semibold text-white">No memories yet</p>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-white/45">
        Connect MCP and ask your agent to remember facts, decisions, and architecture —
        they&apos;ll show up here and in the graph.
      </p>
      <button
        type="button"
        onClick={onOpenMcp}
        className="mt-6 rounded-xl bg-[#4BA0FA] px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(75,160,250,0.3)] hover:bg-[#4BA0FA]/90"
      >
        Set up MCP →
      </button>
    </motion.div>
  );
}
