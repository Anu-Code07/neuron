'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Search, X } from 'lucide-react';
import { memoryPreviewLine } from '@/components/ui/memory-content';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; title: string; type: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function search(q: string) {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('memories')
      .select('id, title, type, content')
      .eq('status', 'active')
      .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
      .limit(10);
    setResults(data ?? []);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-2xl bg-[#1B1F24] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <Search className="size-5 text-[#737373]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search memories..."
            className="flex-1 bg-transparent text-[#fafafa] placeholder:text-[#737373] focus:outline-none"
          />
          <button type="button" onClick={onClose}><X className="size-5 text-[#737373]" /></button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-[#737373]" /></div>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#737373]">
              {query.length < 2 ? 'Type to search...' : 'No results'}
            </p>
          ) : (
            results.map((r) => (
              <div key={r.id} className="rounded-xl px-3 py-2.5 hover:bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase text-[#4BA0FA]">{r.type}</span>
                  <span className="text-[13px] font-medium text-[#fafafa]">{r.title}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#8B8B8B]">
                  {memoryPreviewLine(r.content, 140)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
