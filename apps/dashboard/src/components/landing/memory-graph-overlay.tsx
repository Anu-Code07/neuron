'use client';

import { motion } from 'framer-motion';
import { Brain, Cpu, Layers, Network, Sparkles, Zap } from 'lucide-react';
import { NeuronOrb } from '@/components/ui/neuron-orb';

const MEMORY_TAGS = [
  { label: 'remember_fact', x: '8%', y: '14%' },
  { label: 'remember_decision', x: '6%', y: '38%' },
  { label: 'remember_bug', x: '10%', y: '62%' },
  { label: 'search_memory', x: '72%', y: '18%' },
  { label: 'get_context', x: '78%', y: '48%' },
  { label: 'extract_memories', x: '68%', y: '72%' },
];

const FLOAT = [
  { delay: 0, duration: 4 },
  { delay: 0.5, duration: 5 },
  { delay: 1, duration: 4.5 },
  { delay: 0.3, duration: 5.5 },
  { delay: 0.8, duration: 4.2 },
  { delay: 1.2, duration: 5 },
];

/** Floating AI / memory / context labels over the graph canvas */
export function MemoryGraphOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Zone labels */}
      <div className="absolute left-[6%] top-[6%] rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 backdrop-blur-sm">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Structured</p>
        <p className="text-[11px] font-medium text-white/80">Project facts</p>
      </div>
      <div className="absolute right-[6%] top-[6%] rounded-lg border border-[#4BA0FA]/25 bg-[#4BA0FA]/10 px-2.5 py-1 backdrop-blur-sm">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-[#4BA0FA]/70">Emergent</p>
        <p className="text-[11px] font-medium text-[#4BA0FA]">Context graph</p>
      </div>

      {/* Memory type pills */}
      {MEMORY_TAGS.map((tag, i) => (
        <motion.div
          key={tag.label}
          className="absolute"
          style={{ left: tag.x, top: tag.y }}
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: FLOAT[i].duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: FLOAT[i].delay,
          }}
        >
          <span className="inline-block rounded-md border border-white/15 bg-[#0a0e14]/80 px-2 py-0.5 font-mono text-[9px] text-[#4BA0FA] backdrop-blur-md md:text-[10px]">
            {tag.label}
          </span>
        </motion.div>
      ))}

      {/* Center neuron orb — context engine core */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <NeuronOrb size={56} className="opacity-90" />
      </motion.div>

      {/* Context packet card — bottom center */}
      <motion.div
        className="absolute bottom-[12%] left-1/2 w-[min(280px,85%)] -translate-x-1/2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="rounded-xl border border-white/12 bg-[#0a0e14]/85 p-3 backdrop-blur-xl md:p-3.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#4BA0FA]/20 text-[#4BA0FA]">
              <Layers className="size-3.5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Context packet</p>
              <p className="text-[12px] font-medium text-white">Ready for AI session</p>
            </div>
            <Sparkles className="ml-auto size-4 text-[#36fdfd]" />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {['architecture', 'decisions', 'open bugs', 'APIs'].map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] text-white/55 md:text-[10px]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Side stat chips */}
      <motion.div
        className="absolute bottom-[14%] left-[4%] hidden sm:block"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 backdrop-blur-sm">
          <Brain className="size-3.5 text-[#4BA0FA]" />
          <span className="text-[10px] text-white/60">Memory layer</span>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-[14%] right-[4%] hidden sm:block"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, delay: 0.6 }}
      >
        <div className="flex items-center gap-2 rounded-lg border border-[#4BA0FA]/20 bg-[#4BA0FA]/10 px-2.5 py-1.5 backdrop-blur-sm">
          <Network className="size-3.5 text-[#36fdfd]" />
          <span className="text-[10px] text-[#4BA0FA]">Neuron MCP</span>
        </div>
      </motion.div>

      {/* AI pipeline strip — top */}
      <div className="absolute inset-x-0 top-[4%] flex justify-center gap-2 px-4 md:gap-3">
        {[
          { icon: Cpu, label: 'Groq LLM' },
          { icon: Zap, label: 'Context engine' },
          { icon: Brain, label: 'Persistent memory' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 backdrop-blur-sm md:px-3"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <item.icon className="size-3 text-[#4BA0FA]" />
            <span className="text-[9px] font-medium text-white/55 md:text-[10px]">{item.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Bottom fade only — no quote */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#05080d] to-transparent" />
    </div>
  );
}
