'use client';

import { NeuronOrb } from '@/components/ui/neuron-orb';

export function LoginVisualPanel() {
  return (
    <aside className="relative hidden min-h-0 flex-col overflow-hidden border-white/[0.06] lg:flex lg:h-full lg:border-r">
      <div className="pointer-events-none absolute inset-0 bg-[#030912]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(75,160,250,0.12),transparent_70%)]" />

      <div className="relative z-10 flex flex-1 items-center justify-center px-8">
        <div className="flex flex-col items-center text-center">
          <NeuronOrb size={160} className="mb-8" />
          <h2 className="text-2xl font-medium text-white">Context Engine</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#8B8B8B]">
            One knowledge layer — project context from any AI tool, everywhere you code.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Decisions', value: '142' },
              { label: 'APIs', value: '38' },
              { label: 'Components', value: '67' },
            ].map((s) => (
              <div key={s.label} className="sm-tile px-4 py-3">
                <p className="text-lg font-semibold text-[#fafafa]">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#737373]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="relative z-10 shrink-0 px-8 pb-6 text-center text-sm text-white/40">
        Neuron compiles conversations into structured, AI-ready context packets.
      </p>
    </aside>
  );
}
