'use client';

import { useEffect, useRef } from 'react';
import { Network } from 'lucide-react';

export function GraphView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      draw(ctx, canvas.width, canvas.height);
    };

    const draw = (c: CanvasRenderingContext2D, w: number, h: number) => {
      c.clearRect(0, 0, w, h);
      const nodes = [
        { x: 0.5, y: 0.3, label: 'Auth', r: 8 },
        { x: 0.25, y: 0.55, label: 'Supabase', r: 6 },
        { x: 0.75, y: 0.55, label: 'MCP Server', r: 6 },
        { x: 0.35, y: 0.8, label: 'Dashboard', r: 5 },
        { x: 0.65, y: 0.8, label: 'Context Engine', r: 7 },
        { x: 0.5, y: 0.65, label: 'APIs', r: 5 },
      ];
      const edges = [[0, 1], [0, 2], [1, 3], [2, 4], [0, 5], [4, 5], [2, 4]];

      c.strokeStyle = 'rgba(75, 160, 250, 0.25)';
      c.lineWidth = 1.5 * devicePixelRatio;
      for (const [a, b] of edges) {
        c.beginPath();
        c.moveTo(nodes[a].x * w, nodes[a].y * h);
        c.lineTo(nodes[b].x * w, nodes[b].y * h);
        c.stroke();
      }

      for (const n of nodes) {
        const x = n.x * w;
        const y = n.y * h;
        const grd = c.createRadialGradient(x, y, 0, x, y, n.r * 3 * devicePixelRatio);
        grd.addColorStop(0, 'rgba(75, 160, 250, 0.8)');
        grd.addColorStop(1, 'rgba(75, 160, 250, 0)');
        c.fillStyle = grd;
        c.beginPath();
        c.arc(x, y, n.r * 3 * devicePixelRatio, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = '#4BA0FA';
        c.beginPath();
        c.arc(x, y, n.r * devicePixelRatio, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = '#fafafa';
        c.font = `${11 * devicePixelRatio}px sans-serif`;
        c.textAlign = 'center';
        c.fillText(n.label, x, y + n.r * 3.5 * devicePixelRatio);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <canvas ref={canvasRef} className="h-full w-full flex-1" />
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-[#0A0E14]/80 px-4 py-2 text-sm backdrop-blur-xl">
        <Network className="size-4 text-[#4BA0FA]" />
        <span className="text-[#fafafa]">Knowledge Graph</span>
      </div>
    </div>
  );
}
