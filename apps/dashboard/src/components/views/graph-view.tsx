'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Network, X, Link2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useKnowledgeGraph, type GraphMemory } from '@/lib/hooks/use-knowledge-graph';
import { getMemoryTypeMeta } from '@/lib/memory-theme';
import { useViewMode } from '@/lib/view-mode';
import { KnowledgeGraphCanvas } from '@/components/graph/knowledge-graph-canvas';
import { cn } from '@/lib/utils';

export function GraphView() {
  const { data, isLoading } = useKnowledgeGraph();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { setViewMode } = useViewMode();

  const memories = data?.memories ?? [];
  const relationships = data?.relationships ?? [];
  const selected = memories.find((m) => m.id === selectedId) ?? null;
  const relatedCount = selected
    ? relationships.filter(
        (r) => r.source_memory_id === selected.id || r.target_memory_id === selected.id,
      ).length
    : 0;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(75,160,250,0.12),transparent)]" />

      <div className="relative z-10 flex items-start justify-between gap-3 p-4 pb-0 md:p-5 md:pb-0">
        <div className="glass flex items-center gap-3 rounded-2xl px-4 py-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#4BA0FA]/15 ring-1 ring-[#4BA0FA]/30">
            <Network className="size-4 text-[#4BA0FA]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Knowledge Graph</p>
            <p className="text-[11px] text-white/45">
              {memories.length} nodes · {relationships.length} edges
            </p>
          </div>
        </div>

        {!isLoading && memories.length > 0 && (
          <div className="hidden gap-2 sm:flex">
            {['fact', 'decision', 'pattern', 'architecture', 'api'].map((type) => {
              const meta = getMemoryTypeMeta(type);
              const count = memories.filter((m) => m.type === type).length;
              if (!count) return null;
              return (
                <span
                  key={type}
                  className="glass-pill flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium"
                  style={{ color: meta.color }}
                >
                  <span className="size-1.5 rounded-full" style={{ background: meta.color }} />
                  {meta.label} {count}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="glass flex flex-col items-center gap-3 rounded-2xl px-8 py-10">
              <Loader2 className="size-8 animate-spin text-[#4BA0FA]" />
              <p className="text-sm text-white/50">Mapping your knowledge…</p>
            </div>
          </div>
        ) : memories.length === 0 ? (
          <GraphEmpty onOpenMcp={() => setViewMode('mcp')} />
        ) : (
          <KnowledgeGraphCanvas
            memories={memories}
            relationships={relationships}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}

        <AnimatePresence>
          {selected && (
            <GraphDetailPanel
              memory={selected}
              relatedCount={relatedCount}
              onClose={() => setSelectedId(null)}
            />
          )}
        </AnimatePresence>
      </div>

      <p className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-[11px] text-white/30">
        Drag nodes · Click to inspect · Connections show memory relationships
      </p>
    </div>
  );
}

function GraphDetailPanel({
  memory,
  relatedCount,
  onClose,
}: {
  memory: GraphMemory;
  relatedCount: number;
  onClose: () => void;
}) {
  const meta = getMemoryTypeMeta(memory.type);
  const Icon = meta.icon;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-4 top-4 z-20 w-[min(100%,320px)]"
    >
      <div
        className="glass overflow-hidden rounded-2xl"
        style={{ boxShadow: `0 0 40px ${meta.glow.replace('0.55', '0.15')}` }}
      >
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${meta.color}, transparent)` }}
        />
        <div className="p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className="flex size-9 items-center justify-center rounded-xl ring-1"
                style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
              >
                <Icon className="size-4" />
              </div>
              <div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: meta.color }}
                >
                  {meta.label}
                </span>
                <p className="text-[11px] text-white/40">{memory.layer} layer</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          <h3 className="text-[15px] font-semibold leading-snug text-white">{memory.title}</h3>
          <p className="mt-2 line-clamp-5 text-[12px] leading-relaxed text-white/55">
            {memory.content}
          </p>

          {memory.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {memory.tags.slice(0, 6).map((tag) => (
                <span key={tag} className="glass-pill px-2 py-0.5 text-[10px] text-white/50">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatPill label="Confidence" value={`${Math.round(memory.confidence * 100)}%`} />
            <StatPill label="Links" value={String(relatedCount)} icon={Link2} />
          </div>

          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[10px] text-white/40">
              <span>Importance</span>
              <span>{Math.round(memory.importance * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${memory.importance * 100}%`,
                  background: `linear-gradient(90deg, ${meta.color}, #36FDFD)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

function StatPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="glass-inner rounded-xl px-3 py-2">
      <p className="text-[10px] text-white/40">{label}</p>
      <p className="flex items-center gap-1 text-sm font-semibold text-white">
        {Icon && <Icon className="size-3 text-[#4BA0FA]" />}
        {value}
      </p>
    </div>
  );
}

function GraphEmpty({ onOpenMcp }: { onOpenMcp: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <div className="absolute inset-0 animate-pulse rounded-full bg-[#4BA0FA]/20 blur-3xl" />
        <div className="glass relative flex size-24 items-center justify-center rounded-3xl">
          <Network className="size-10 text-[#4BA0FA]" />
        </div>
      </motion.div>
      <h3 className="mt-6 text-xl font-semibold text-white">Your graph is waiting</h3>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-white/45">
        Memories become nodes. Relationships become edges. Connect MCP and store knowledge —
        your living context map appears here.
      </p>
      <button
        type="button"
        onClick={onOpenMcp}
        className={cn(
          'mt-6 flex items-center gap-2 rounded-xl bg-[#4BA0FA] px-5 py-2.5',
          'text-sm font-medium text-white shadow-[0_8px_32px_rgba(75,160,250,0.35)]',
          'transition hover:bg-[#4BA0FA]/90',
        )}
      >
        <Sparkles className="size-4" />
        Set up MCP
      </button>
    </div>
  );
}
