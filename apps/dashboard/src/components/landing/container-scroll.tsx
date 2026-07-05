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
          <div className="rounded-2xl border border-white/10 bg-[#0a0e14] p-2 shadow-[0_32px_80px_rgba(0,0,0,0.55)] md:rounded-3xl md:p-3">
            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#05080d] md:rounded-2xl">
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
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl md:leading-[1.1]">
            Unleash the power of
            <br />
            <span className="text-white/90">memory graphs</span>
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
