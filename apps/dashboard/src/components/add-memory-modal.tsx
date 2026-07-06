'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ContextLayer, MemoryType } from '@neuron/shared';
import { useActiveProject } from '@/lib/hooks/use-active-project';
import { Loader2, X } from 'lucide-react';

interface AddMemoryModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddMemoryModal({ open, onClose }: AddMemoryModalProps) {
  const { activeProjectId } = useActiveProject();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<string>(MemoryType.Fact);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProjectId) return;
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from('memories').insert({
      project_id: activeProjectId,
      type,
      layer: ContextLayer.Project,
      title,
      content,
      confidence: 0.85,
      importance: 0.7,
      source_type: 'manual',
    });

    setLoading(false);
    if (!error) {
      setTitle('');
      setContent('');
      onClose();
      window.location.reload();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#1B1F24] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#fafafa]">Add memory</h3>
          <button type="button" onClick={onClose} className="text-[#737373] hover:text-white">
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#14161A] px-4 py-2.5 text-sm text-[#fafafa]"
          >
            {Object.values(MemoryType).slice(0, 12).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-xl border border-white/10 bg-[#14161A] px-4 py-2.5 text-sm text-[#fafafa] placeholder:text-[#737373]"
          />
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Content"
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-[#14161A] px-4 py-2.5 text-sm text-[#fafafa] placeholder:text-[#737373] resize-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4BA0FA] py-3 text-sm font-medium text-white hover:bg-[#4BA0FA]/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Save memory
          </button>
        </form>
      </div>
    </div>
  );
}
