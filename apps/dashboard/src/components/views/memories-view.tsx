'use client';

import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_COLORS: Record<string, string> = {
  decision: 'text-violet-300 bg-violet-500/15',
  api: 'text-cyan-300 bg-cyan-500/15',
  bug: 'text-red-300 bg-red-500/15',
  pattern: 'text-emerald-300 bg-emerald-500/15',
  architecture: 'text-amber-300 bg-amber-500/15',
  fact: 'text-blue-300 bg-blue-500/15',
};

export function MemoriesView() {
  const { data, isLoading, refetch } = useMemories();

  return (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 pt-2 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#fafafa]">All memories</h2>
          <p className="text-[13px] text-[#737373]">{data?.length ?? 0} structured knowledge items</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-[#737373]" />
        </div>
      ) : !data?.length ? (
        <EmptyMemories />
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
          {data.map((m) => (
            <MemoryCard key={m.id} memory={m} onDelete={() => refetch()} />
          ))}
        </div>
      )}
    </div>
  );
}

function useMemories() {
  return useQuery({
    queryKey: ['memories-all'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function MemoryCard({
  memory,
  onDelete,
}: {
  memory: { id: string; title: string; content: string; type: string; confidence: number; updated_at: string };
  onDelete: () => void;
}) {
  const color = TYPE_COLORS[memory.type] ?? 'text-[#737373] bg-[#0F1217]';

  async function handleDelete() {
    const supabase = createClient();
    await supabase.from('memories').update({ status: 'forgotten' }).eq('id', memory.id);
    onDelete();
  }

  return (
    <article className="mb-4 break-inside-avoid sm-tile group p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium uppercase', color)}>
          {memory.type}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          className="opacity-0 transition-opacity group-hover:opacity-100 text-[#737373] hover:text-red-400"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <h3 className="text-[14px] font-semibold text-[#fafafa]">{memory.title}</h3>
      <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-[#8B8B8B]">{memory.content}</p>
      <div className="mt-3 flex items-center justify-between text-[11px] text-[#737373]">
        <span>{Math.round(memory.confidence * 100)}% confidence</span>
        <span>{new Date(memory.updated_at).toLocaleDateString()}</span>
      </div>
    </article>
  );
}

function EmptyMemories() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#14161A]">
        <MoreHorizontal className="size-8 text-[#525D6E]" />
      </div>
      <p className="text-lg font-medium text-[#fafafa]">No memories yet</p>
      <p className="mt-2 max-w-sm text-[13px] text-[#737373]">
        Use the MCP server or Add memory to store decisions, APIs, bugs, and architecture.
      </p>
    </div>
  );
}
