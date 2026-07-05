'use client';

import { useState } from 'react';
import { NeuronOrb } from '@/components/ui/neuron-orb';
import { Send, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'What authentication provider are we using?',
  'Summarize the project architecture',
  'What APIs are defined for auth?',
  'Show open bugs and their severity',
];

export function ContextView() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(query: string) {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResponse(JSON.stringify(data.packet ?? data, null, 2));
    } catch {
      setResponse('Failed to fetch context. Ensure Supabase is connected.');
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-6">
        {!response ? (
          <div className="max-w-lg text-center">
            <NeuronOrb size={80} className="mx-auto mb-6 blur-[1px]" />
            <h2 className="text-xl font-medium text-[#fafafa]">Ask your context engine</h2>
            <p className="mt-2 text-[13px] text-[#737373]">
              Get compressed, AI-ready context packets from your project knowledge.
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setInput(s); ask(s); }}
                  className="sm-tile px-4 py-3 text-left text-[13px] text-[#fafafa]"
                >
                  <Sparkles className="mb-1 size-3.5 text-[#4BA0FA]" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <pre className="w-full max-w-3xl overflow-auto rounded-2xl bg-[#14161A] p-6 text-left text-[12px] leading-relaxed text-[#8B8B8B] font-mono">
            {response}
          </pre>
        )}
      </div>

      <div className="border-t border-white/[0.08] bg-[#0A0E14]/90 p-4 backdrop-blur-xl">
        <form
          onSubmit={(e) => { e.preventDefault(); ask(input); }}
          className="mx-auto flex max-w-3xl gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about architecture, decisions, APIs..."
            className="flex-1 rounded-xl border border-white/10 bg-[#14161A] px-4 py-3 text-sm text-[#fafafa] placeholder:text-[#737373] focus:border-[#4BA0FA]/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex size-11 items-center justify-center rounded-xl bg-[#4BA0FA] text-white hover:bg-[#4BA0FA]/90 disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
