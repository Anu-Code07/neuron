'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, Copy, Loader2, X } from 'lucide-react';
import { GlassCodeBlock } from '@/components/ui/glass-card';

interface MemoryJsonModalProps {
  memoryId: string | null;
  onClose: () => void;
}

export async function fetchMemoryRecord(memoryId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('id', memoryId)
    .single();
  if (error) throw error;
  return data;
}

export function MemoryJsonModal({ memoryId, onClose }: MemoryJsonModalProps) {
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!memoryId) {
      setRecord(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMemoryRecord(memoryId)
      .then((data) => {
        if (!cancelled) setRecord(data as Record<string, unknown>);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load memory');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [memoryId]);

  if (!memoryId) return null;

  const json = record ? JSON.stringify(record, null, 2) : '';

  async function handleCopy() {
    if (!json) return;
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="memory-json-title"
    >
      <div
        className="glass flex max-h-[min(85vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
          <div className="min-w-0">
            <p id="memory-json-title" className="text-sm font-semibold text-white">
              Memory JSON
            </p>
            <p className="truncate font-mono text-[11px] text-white/40">{memoryId}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!record}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-white/50">
              <Loader2 className="size-5 animate-spin text-[#4BA0FA]" />
              Loading record…
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-400">{error}</p>
          ) : (
            <GlassCodeBlock code={json} className="text-[11px] text-white/75" />
          )}
        </div>
      </div>
    </div>
  );
}
