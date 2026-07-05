'use client';

import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grid: boolean;
}

const GRID_COLS = 14;
const GRID_ROWS = 10;
const CONNECT_DIST = 72;

function buildNodes(w: number, h: number): Node[] {
  const nodes: Node[] = [];
  const padX = w * 0.06;
  const padY = h * 0.1;
  const gridW = w * 0.42;
  const cellW = gridW / GRID_COLS;
  const cellH = (h - padY * 2) / GRID_ROWS;

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      nodes.push({
        x: padX + col * cellW + cellW / 2,
        y: padY + row * cellH + cellH / 2,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        grid: true,
      });
    }
  }

  const chaosCount = 55;
  for (let i = 0; i < chaosCount; i++) {
    const t = i / chaosCount;
    nodes.push({
      x: w * 0.48 + t * w * 0.46 + (Math.random() - 0.5) * 40,
      y: padY + Math.random() * (h - padY * 2),
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      grid: false,
    });
  }

  return nodes;
}

export function MemoryGraphCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodesRef.current = buildNodes(w, h);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      const nodes = nodesRef.current;

      ctx.fillStyle = '#05080d';
      ctx.fillRect(0, 0, w, h);

      // Fracture gradient center
      const grad = ctx.createLinearGradient(w * 0.38, 0, w * 0.55, 0);
      grad.addColorStop(0, 'rgba(75,160,250,0.03)');
      grad.addColorStop(0.5, 'rgba(54,253,253,0.06)');
      grad.addColorStop(1, 'rgba(75,160,250,0.02)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Update positions
      for (const n of nodes) {
        if (!n.grid) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < w * 0.44 || n.x > w - 20) n.vx *= -1;
          if (n.y < 16 || n.y > h - 16) n.vy *= -1;
        }
      }

      // Draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * (a.grid && b.grid ? 0.35 : 0.22);
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const r = n.grid ? 2.2 : 2.8;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = n.grid ? 'rgba(255,255,255,0.85)' : 'rgba(75,160,250,0.95)';
        ctx.fill();
        if (!n.grid) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(75,160,250,0.15)';
          ctx.fill();
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
    />
  );
}
