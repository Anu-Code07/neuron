import { getMemoryTypeMeta } from '@/lib/memory-theme';

export interface GraphMetaphor {
  slug: string;
  metaphor: string;
  meaning: string;
}

export const GRAPH_METAPHORS: Record<string, GraphMetaphor> = {
  bug: {
    slug: 'bug',
    metaphor: 'Jellyfish',
    meaning: 'Drifting issues — tentacles reach related memories',
  },
  architecture: {
    slug: 'architecture',
    metaphor: 'Thunder',
    meaning: 'Structural lightning — core system design',
  },
  fact: {
    slug: 'fact',
    metaphor: 'Star',
    meaning: 'Stable anchor — verified project truth',
  },
  decision: {
    slug: 'decision',
    metaphor: 'Fork',
    meaning: 'Branching choice — path taken vs alternatives',
  },
  pattern: {
    slug: 'pattern',
    metaphor: 'Honeycomb',
    meaning: 'Repeating convention — fits the hive',
  },
  api: {
    slug: 'api',
    metaphor: 'Port',
    meaning: 'Connection endpoint — data in/out',
  },
  component: {
    slug: 'component',
    metaphor: 'Crystal',
    meaning: 'Modular building block',
  },
  database: {
    slug: 'database',
    metaphor: 'Stack',
    meaning: 'Layered data — schema disks',
  },
  task: {
    slug: 'task',
    metaphor: 'Beacon',
    meaning: 'Active work signal',
  },
  note: {
    slug: 'note',
    metaphor: 'Feather',
    meaning: 'Lightweight annotation',
  },
  file: {
    slug: 'file',
    metaphor: 'Shard',
    meaning: 'Code/file fragment',
  },
  conversation: {
    slug: 'conversation',
    metaphor: 'Ripple',
    meaning: 'Ephemeral chat echo',
  },
  relationship: {
    slug: 'relationship',
    metaphor: 'Bridge',
    meaning: 'Link between two memories',
  },
};

export function getGraphMetaphor(type: string): GraphMetaphor {
  return (
    GRAPH_METAPHORS[type] ?? {
      slug: type,
      metaphor: 'Orb',
      meaning: 'General knowledge node',
    }
  );
}

export interface NodeDrawOpts {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  r: number;
  color: string;
  glow: string;
  tick: number;
  active: boolean;
}

function drawGlow(o: NodeDrawOpts, scale = 4, alpha = 0.25) {
  const { ctx, x, y, r, glow, active } = o;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * scale);
  g.addColorStop(0, active ? glow : glow.replace('0.55', String(alpha)));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawJellyfish(o: NodeDrawOpts) {
  const { ctx, x, y, r, color, tick, active } = o;
  drawGlow(o, 3.2, 0.35);

  const bellH = r * 1.1;
  const bellW = r * 1.4;
  const bob = Math.sin(tick * 0.05) * 2;

  ctx.save();
  ctx.translate(x, y + bob);

  const bellGrad = ctx.createRadialGradient(0, -bellH * 0.2, 0, 0, 0, bellW);
  bellGrad.addColorStop(0, `${color}ee`);
  bellGrad.addColorStop(0.7, `${color}99`);
  bellGrad.addColorStop(1, `${color}22`);
  ctx.fillStyle = bellGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, bellW, bellH, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  const tentacles = 7;
  for (let i = 0; i < tentacles; i++) {
    const spread = (i / (tentacles - 1) - 0.5) * bellW * 1.6;
    ctx.strokeStyle = active ? `${color}cc` : `${color}66`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(spread * 0.35, bellH * 0.1);
    for (let t = 0; t <= 1; t += 0.12) {
      const ty = bellH * 0.2 + t * r * 2.2;
      const wave = Math.sin(tick * 0.08 + i + t * 6) * (4 + t * 5);
      ctx.lineTo(spread + wave, ty);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function drawThunder(o: NodeDrawOpts) {
  const { ctx, x, y, r, color, tick, active } = o;
  drawGlow(o, 3.5, 0.4);

  const flash = 0.6 + Math.sin(tick * 0.12) * 0.4;
  const bolts = [
    [[0, -r * 1.8], [-r * 0.5, -r * 0.3], [r * 0.3, r * 0.5], [-r * 0.2, r * 1.6]],
    [[r * 0.4, -r * 1.5], [r * 1.2, -r * 0.2], [r * 0.6, r * 1.2]],
    [[-r * 0.5, -r * 1.4], [-r * 1.1, r * 0.1], [-r * 0.7, r * 1.3]],
  ];

  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = color;
  ctx.shadowBlur = active ? 18 : 8;

  for (const path of bolts) {
    ctx.strokeStyle = active ? '#FFF8E7' : color;
    ctx.lineWidth = active ? 2.2 : 1.4;
    ctx.globalAlpha = flash;
    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStar(o: NodeDrawOpts) {
  const { ctx, x, y, r, color, tick } = o;
  drawGlow(o, 3, 0.3);
  const spikes = 5;
  const outer = r * 1.3;
  const inner = r * 0.55;
  const rot = tick * 0.01;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rad = (i * Math.PI) / spikes - Math.PI / 2;
    const dist = i % 2 === 0 ? outer : inner;
    const px = Math.cos(rad) * dist;
    const py = Math.sin(rad) * dist;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFork(o: NodeDrawOpts) {
  const { ctx, x, y, r, color } = o;
  drawGlow(o, 2.8, 0.28);
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, r * 1.2);
  ctx.lineTo(0, -r * 0.2);
  ctx.moveTo(0, -r * 0.2);
  ctx.lineTo(-r * 0.9, -r * 1.1);
  ctx.moveTo(0, -r * 0.2);
  ctx.lineTo(r * 0.9, -r * 1.1);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, r * 0.5, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHoneycomb(o: NodeDrawOpts) {
  const { ctx, x, y, r, color, tick } = o;
  drawGlow(o, 2.8, 0.28);
  const rot = tick * 0.008;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const px = Math.cos(a) * r * 1.1;
    const py = Math.sin(a) * r * 1.1;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = `${color}44`;
  ctx.fill();
  ctx.restore();
}

function drawPort(o: NodeDrawOpts) {
  const { ctx, x, y, r, color } = o;
  drawGlow(o, 2.6, 0.28);
  ctx.fillStyle = `${color}33`;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCrystal(o: NodeDrawOpts) {
  const { ctx, x, y, r, color } = o;
  drawGlow(o, 2.8, 0.28);
  ctx.fillStyle = `${color}55`;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.3);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r * 1.3);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawStack(o: NodeDrawOpts) {
  const { ctx, x, y, r, color } = o;
  drawGlow(o, 2.6, 0.28);
  for (let i = 0; i < 3; i++) {
    const oy = i * 5 - 5;
    ctx.fillStyle = i === 2 ? color : `${color}88`;
    ctx.beginPath();
    ctx.ellipse(x, y + oy, r * 1.1, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBeacon(o: NodeDrawOpts) {
  const { ctx, x, y, r, color, tick } = o;
  drawGlow(o, 3, 0.3);
  const pulse = 1 + Math.sin(tick * 0.1) * 0.2;
  ctx.strokeStyle = `${color}44`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.8 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.2);
  ctx.lineTo(x + r * 0.7, y + r * 0.8);
  ctx.lineTo(x - r * 0.7, y + r * 0.8);
  ctx.closePath();
  ctx.fill();
}

function drawFeather(o: NodeDrawOpts) {
  const { ctx, x, y, r, color, tick } = o;
  drawGlow(o, 2.4, 0.22);
  const sway = Math.sin(tick * 0.06) * 0.15;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, r * 1.4);
  ctx.quadraticCurveTo(r * 0.8, 0, 0, -r * 1.4);
  ctx.stroke();
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * r * 0.35);
    ctx.lineTo(r * 0.55, i * r * 0.35 + r * 0.15);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRipple(o: NodeDrawOpts) {
  const { ctx, x, y, r, color, tick } = o;
  drawGlow(o, 2.8, 0.25);
  for (let i = 0; i < 3; i++) {
    const phase = ((tick * 0.04 + i * 0.33) % 1);
    ctx.strokeStyle = `${color}${Math.floor((1 - phase) * 99).toString(16).padStart(2, '0')}`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, r * (0.6 + phase * 1.4), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawOrb(o: NodeDrawOpts) {
  const { ctx, x, y, r, color } = o;
  drawGlow(o, 3, 0.25);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function drawMemoryNode(type: string, opts: NodeDrawOpts) {
  switch (type) {
    case 'bug':
      drawJellyfish(opts);
      break;
    case 'architecture':
      drawThunder(opts);
      break;
    case 'fact':
      drawStar(opts);
      break;
    case 'decision':
      drawFork(opts);
      break;
    case 'pattern':
      drawHoneycomb(opts);
      break;
    case 'api':
      drawPort(opts);
      break;
    case 'component':
      drawCrystal(opts);
      break;
    case 'database':
      drawStack(opts);
      break;
    case 'task':
      drawBeacon(opts);
      break;
    case 'note':
      drawFeather(opts);
      break;
    case 'conversation':
      drawRipple(opts);
      break;
    case 'file':
      drawCrystal({ ...opts, color: opts.color });
      break;
    default:
      drawOrb(opts);
  }
}

export function nodeHitRadius(type: string, r: number): number {
  switch (type) {
    case 'bug':
      return r * 2.8;
    case 'architecture':
      return r * 2.4;
    case 'fact':
    case 'task':
      return r * 1.8;
    default:
      return r + 12;
  }
}

export function drawLegendIcon(
  ctx: CanvasRenderingContext2D,
  type: string,
  cx: number,
  cy: number,
  size: number,
  tick: number,
) {
  const meta = getMemoryTypeMeta(type);
  drawMemoryNode(type, {
    ctx,
    x: cx,
    y: cy,
    r: size,
    color: meta.color,
    glow: meta.glow,
    tick,
    active: false,
  });
}
