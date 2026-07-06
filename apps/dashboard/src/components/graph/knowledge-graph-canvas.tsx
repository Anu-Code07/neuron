'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { GraphMemory, GraphRelationship } from '@/lib/hooks/use-knowledge-graph';
import { getMemoryTypeMeta, RELATIONSHIP_COLORS } from '@/lib/memory-theme';
import { drawMemoryNode, getGraphMetaphor, nodeHitRadius } from './graph-node-visuals';

interface SimNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  importance: number;
  connections: number;
}

interface SimEdge {
  source: number;
  target: number;
  type: string;
}

interface KnowledgeGraphCanvasProps {
  memories: GraphMemory[];
  relationships: GraphRelationship[];
  selectedId: string | null;
  highlightId?: string | null;
  onSelect: (id: string | null) => void;
}

function truncate(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function KnowledgeGraphCanvas({
  memories,
  relationships,
  selectedId,
  highlightId,
  onSelect,
}: KnowledgeGraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const edgesRef = useRef<SimEdge[]>([]);
  const frameRef = useRef(0);
  const tickRef = useRef(0);
  const mouseRef = useRef({ x: -1, y: -1 });
  const hoveredRef = useRef<number>(-1);
  const dragRef = useRef<{ idx: number } | null>(null);

  const buildGraph = useCallback((w: number, h: number) => {
    const connectionCount = new Map<string, number>();
    for (const r of relationships) {
      connectionCount.set(r.source_memory_id, (connectionCount.get(r.source_memory_id) ?? 0) + 1);
      connectionCount.set(r.target_memory_id, (connectionCount.get(r.target_memory_id) ?? 0) + 1);
    }

    const idToIndex = new Map<string, number>();
    const nodes: SimNode[] = memories.map((m, i) => {
      idToIndex.set(m.id, i);
      const angle = (i / memories.length) * Math.PI * 2;
      const radius = Math.min(w, h) * 0.28;
      const connections = connectionCount.get(m.id) ?? 0;
      return {
        id: m.id,
        label: truncate(m.title, 28),
        type: m.type,
        x: w / 2 + Math.cos(angle) * radius,
        y: h / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        r: 12 + Math.min(connections, 6) * 1.2 + m.importance * 5,
        importance: m.importance,
        connections,
      };
    });

    const edges: SimEdge[] = [];
    for (const r of relationships) {
      const si = idToIndex.get(r.source_memory_id);
      const ti = idToIndex.get(r.target_memory_id);
      if (si !== undefined && ti !== undefined) {
        edges.push({ source: si, target: ti, type: r.type });
      }
    }

    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [memories, relationships]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || memories.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      dpr = window.devicePixelRatio || 1;
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (nodesRef.current.length === 0) buildGraph(w, h);
    };

    const simulate = () => {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const cx = w / 2;
      const cy = h / 2;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 1;
          const force = 1200 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      for (const e of edges) {
        const a = nodes[e.source];
        const b = nodes[e.target];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const force = (dist - 90) * 0.004;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }

      for (const n of nodes) {
        n.vx += (cx - n.x) * 0.0008;
        n.vy += (cy - n.y) * 0.0008;

        if (dragRef.current && nodes[dragRef.current.idx] === n) continue;

        n.vx *= 0.86;
        n.vy *= 0.86;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(40, Math.min(w - 40, n.x));
        n.y = Math.max(40, Math.min(h - 40, n.y));
      }
    };

    const drawGrid = () => {
      ctx.fillStyle = '#05080d';
      ctx.fillRect(0, 0, w, h);

      const grad = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), Math.max(w, h) * 0.55);
      grad.addColorStop(0, 'rgba(75,160,250,0.07)');
      grad.addColorStop(0.5, 'rgba(54,253,253,0.03)');
      grad.addColorStop(1, 'rgba(5,8,13,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      const step = 28;
      for (let x = 0; x < w; x += step) {
        for (let y = 0; y < h; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    function cx() { return w / 2; }
    function cy() { return h / 2; }

    const draw = () => {
      tickRef.current += 1;
      simulate();
      drawGrid();

      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const hovered = hoveredRef.current;
      const selectedIdx = selectedId ? nodes.findIndex((n) => n.id === selectedId) : -1;
      const highlightIdx = highlightId ? nodes.findIndex((n) => n.id === highlightId) : -1;
      const flow = (tickRef.current * 0.4) % 20;

      for (const e of edges) {
        const a = nodes[e.source];
        const b = nodes[e.target];
        const isActive =
          hovered === e.source || hovered === e.target ||
          selectedIdx === e.source || selectedIdx === e.target ||
          highlightIdx === e.source || highlightIdx === e.target;

        const color = RELATIONSHIP_COLORS[e.type] ?? '#4BA0FA';
        ctx.strokeStyle = isActive ? `${color}99` : `${color}33`;
        ctx.lineWidth = isActive ? 1.8 : 1;
        ctx.setLineDash(isActive ? [6, 14] : []);
        ctx.lineDashOffset = -flow;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const meta = getMemoryTypeMeta(n.type);
        const isHovered = hovered === i;
        const isSelected = selectedIdx === i;
        const isHighlight = highlightIdx === i;
        const active = isHovered || isSelected || isHighlight;
        const pulse = active ? 1 + Math.sin(tickRef.current * 0.08) * 0.12 : 1;
        const radius = n.r * pulse;

        drawMemoryNode(n.type, {
          ctx,
          x: n.x,
          y: n.y,
          r: radius,
          color: meta.color,
          glow: meta.glow,
          tick: tickRef.current,
          active,
        });

        if (active) {
          ctx.strokeStyle = 'rgba(250,250,250,0.85)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(n.x, n.y, nodeHitRadius(n.type, radius), 0, Math.PI * 2);
          ctx.stroke();
        }

        const showLabel = active || nodes.length <= 8;
        if (showLabel) {
          const metaphor = getGraphMetaphor(n.type);
          ctx.fillStyle = active ? 'rgba(250,250,250,0.95)' : 'rgba(250,250,250,0.55)';
          ctx.font = active ? '600 11px ui-sans-serif, system-ui, sans-serif' : '500 10px ui-sans-serif, system-ui, sans-serif';
          ctx.textAlign = 'center';
          const labelY = n.y + nodeHitRadius(n.type, radius) + 12;
          if (active) {
            ctx.fillText(n.label, n.x, labelY);
            ctx.fillStyle = meta.color;
            ctx.font = '500 9px ui-sans-serif, system-ui, sans-serif';
            ctx.fillText(`${metaphor.metaphor.toUpperCase()} · ${meta.label.toUpperCase()}`, n.x, labelY + 12);
          } else {
            ctx.fillStyle = `${meta.color}cc`;
            ctx.fillText(metaphor.metaphor, n.x, labelY);
          }
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    const hitTest = (mx: number, my: number) => {
      const nodes = nodesRef.current;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (Math.hypot(mx - n.x, my - n.y) < nodeHitRadius(n.type, n.r)) return i;
      }
      return -1;
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouseRef.current = { x: mx, y: my };

      if (dragRef.current) {
        const n = nodesRef.current[dragRef.current.idx];
        n.x = mx;
        n.y = my;
        n.vx = 0;
        n.vy = 0;
        return;
      }

      const idx = hitTest(mx, my);
      hoveredRef.current = idx;
      canvas.style.cursor = idx >= 0 ? 'pointer' : 'default';
    };

    const onDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const idx = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (idx >= 0) {
        dragRef.current = { idx };
        onSelect(nodesRef.current[idx].id);
      } else {
        onSelect(null);
      }
    };

    const onUp = () => {
      dragRef.current = null;
    };

    resize();
    buildGraph(w, h);
    frameRef.current = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, [memories, relationships, selectedId, highlightId, buildGraph, onSelect]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none"
      aria-label="Interactive knowledge graph"
    />
  );
}
