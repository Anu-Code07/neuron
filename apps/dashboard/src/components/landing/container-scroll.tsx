'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MemoryGraphCanvas } from './memory-graph-canvas';
import { MemoryGraphOverlay } from './memory-graph-overlay';

interface ContainerScrollProps {
  titleComponent?: React.ReactNode;
  children: React.ReactNode;
}

export function ContainerScroll({ titleComponent, children }: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.8], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], [1.08, 1]);
  const translateY = useTransform(scrollYProgress, [0, 0.8], [40, 0]);

  return (
    <div ref={containerRef} className="relative h-[60rem] md:h-[70rem]">
      <div className="sticky top-24 flex flex-col items-center overflow-hidden px-4 md:top-32">
        {titleComponent}

        <motion.div
          style={{ rotateX, scale, translateY, transformPerspective: 1200 }}
          className="relative mt-10 w-full max-w-5xl"
        >
          <div className="absolute -inset-1 rounded-[1.75rem] bg-gradient-to-r from-[#4BA0FA]/30 via-[#36fdfd]/20 to-[#a78bfa]/30 blur-xl" />
          <div className="relative rounded-2xl border border-white/15 bg-[#0a0e14]/90 p-2 shadow-[0_40px_100px_rgba(0,0,0,0.6)] md:rounded-3xl md:p-3">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 font-mono text-[10px] text-white/30">neuron — memory graph</span>
            </div>
            <div className="overflow-hidden rounded-b-xl bg-[#05080d] md:rounded-b-2xl">
              {children}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function MemoryGraphScrollSection() {
  return (
    <ContainerScroll
      titleComponent={
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-[#4BA0FA]">
            Knowledge graph
          </p>
          <h2 className="font-display mt-3 text-3xl text-white md:text-5xl lg:text-6xl md:leading-[1.05]">
            Unleash the power of
            <br />
            <span className="text-shimmer italic">memory graphs</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] text-white/45">
            Ordered facts on the left. Emergent connections on the right. Neuron turns chaos into context your AI can use.
          </p>
        </div>
      }
    >
      <div className="relative h-[360px] md:h-[460px]">
        <MemoryGraphCanvas className="absolute inset-0 h-full w-full" />
        <MemoryGraphOverlay />
      </div>
    </ContainerScroll>
  );
}
