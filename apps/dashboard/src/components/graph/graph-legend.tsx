'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMemoryTypeMeta } from '@/lib/memory-theme';
import { drawLegendIcon, getGraphMetaphor, GRAPH_METAPHORS } from './graph-node-visuals';

interface GraphLegendProps {
  types: string[];
  className?: string;
}

export function GraphLegend({ types, className }: GraphLegendProps) {
  const [open, setOpen] = useState(true);
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const tickRef = useRef(0);
  const frameRef = useRef(0);

  const uniqueTypes = [...new Set(types)].sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    let running = true;
    const draw = () => {
      if (!running) return;
      tickRef.current += 1;
      for (const type of uniqueTypes) {
        const canvas = canvasRefs.current.get(type);
        if (!canvas) continue;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        const dpr = window.devicePixelRatio || 1;
        const w = 28;
        const h = 28;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        drawLegendIcon(ctx, type, w / 2, h / 2 + 2, 5, tickRef.current);
      }
      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [uniqueTypes]);

  if (!uniqueTypes.length) return null;

  return (
    <div className={cn('glass pointer-events-auto absolute bottom-14 left-4 z-20 w-[min(100%,280px)] overflow-hidden rounded-2xl', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-white/[0.04]"
      >
        <span className="text-[12px] font-semibold text-white">Node legend</span>
        {open ? <ChevronDown className="size-4 text-white/40" /> : <ChevronUp className="size-4 text-white/40" />}
      </button>
      {open && (
        <ul className="custom-scrollbar max-h-52 overflow-y-auto border-t border-white/[0.06] px-2 py-2">
          {uniqueTypes.map((type) => {
            const meta = getMemoryTypeMeta(type);
            const metaphor = getGraphMetaphor(type);
            return (
              <li key={type} className="flex items-start gap-2.5 rounded-lg px-1.5 py-2 hover:bg-white/[0.03]">
                <canvas
                  ref={(el) => {
                    if (el) canvasRefs.current.set(type, el);
                  }}
                  className="size-7 shrink-0"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-white">
                    {metaphor.metaphor}
                    <span className="ml-1.5 font-normal text-white/35">· {meta.label}</span>
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-white/45">{metaphor.meaning}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function allGraphMetaphorTypes(): string[] {
  return Object.keys(GRAPH_METAPHORS);
}
