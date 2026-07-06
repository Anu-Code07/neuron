import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Box,
  Brain,
  Bug,
  Database,
  FileCode,
  GitBranch,
  Layers,
  Lightbulb,
  MessageSquare,
  Network,
  Plug,
  Scale,
  Sparkles,
  StickyNote,
} from 'lucide-react';

export interface MemoryTypeMeta {
  label: string;
  color: string;
  glow: string;
  bg: string;
  border: string;
  icon: LucideIcon;
}

export const MEMORY_TYPE_META: Record<string, MemoryTypeMeta> = {
  fact: {
    label: 'Fact',
    color: '#60A5FA',
    glow: 'rgba(96,165,250,0.55)',
    bg: 'rgba(96,165,250,0.12)',
    border: 'rgba(96,165,250,0.35)',
    icon: Lightbulb,
  },
  decision: {
    label: 'Decision',
    color: '#A78BFA',
    glow: 'rgba(167,139,250,0.55)',
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.35)',
    icon: Scale,
  },
  pattern: {
    label: 'Pattern',
    color: '#34D399',
    glow: 'rgba(52,211,153,0.55)',
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.35)',
    icon: Sparkles,
  },
  architecture: {
    label: 'Architecture',
    color: '#FBBF24',
    glow: 'rgba(251,191,36,0.55)',
    bg: 'rgba(251,191,36,0.12)',
    border: 'rgba(251,191,36,0.35)',
    icon: Layers,
  },
  bug: {
    label: 'Bug',
    color: '#F87171',
    glow: 'rgba(248,113,113,0.55)',
    bg: 'rgba(248,113,113,0.12)',
    border: 'rgba(248,113,113,0.35)',
    icon: Bug,
  },
  api: {
    label: 'API',
    color: '#22D3EE',
    glow: 'rgba(34,211,238,0.55)',
    bg: 'rgba(34,211,238,0.12)',
    border: 'rgba(34,211,238,0.35)',
    icon: Plug,
  },
  component: {
    label: 'Component',
    color: '#818CF8',
    glow: 'rgba(129,140,248,0.55)',
    bg: 'rgba(129,140,248,0.12)',
    border: 'rgba(129,140,248,0.35)',
    icon: Box,
  },
  database: {
    label: 'Database',
    color: '#2DD4BF',
    glow: 'rgba(45,212,191,0.55)',
    bg: 'rgba(45,212,191,0.12)',
    border: 'rgba(45,212,191,0.35)',
    icon: Database,
  },
  task: {
    label: 'Task',
    color: '#FB923C',
    glow: 'rgba(251,146,60,0.55)',
    bg: 'rgba(251,146,60,0.12)',
    border: 'rgba(251,146,60,0.35)',
    icon: GitBranch,
  },
  note: {
    label: 'Note',
    color: '#94A3B8',
    glow: 'rgba(148,163,184,0.45)',
    bg: 'rgba(148,163,184,0.1)',
    border: 'rgba(148,163,184,0.3)',
    icon: StickyNote,
  },
  file: {
    label: 'File',
    color: '#E879F9',
    glow: 'rgba(232,121,249,0.5)',
    bg: 'rgba(232,121,249,0.1)',
    border: 'rgba(232,121,249,0.3)',
    icon: FileCode,
  },
  conversation: {
    label: 'Conversation',
    color: '#38BDF8',
    glow: 'rgba(56,189,248,0.5)',
    bg: 'rgba(56,189,248,0.1)',
    border: 'rgba(56,189,248,0.3)',
    icon: MessageSquare,
  },
  relationship: {
    label: 'Link',
    color: '#4BA0FA',
    glow: 'rgba(75,160,250,0.5)',
    bg: 'rgba(75,160,250,0.1)',
    border: 'rgba(75,160,250,0.3)',
    icon: Network,
  },
};

export function getMemoryTypeMeta(type: string): MemoryTypeMeta {
  return (
    MEMORY_TYPE_META[type] ?? {
      label: type,
      color: '#737373',
      glow: 'rgba(115,115,115,0.4)',
      bg: 'rgba(115,115,115,0.1)',
      border: 'rgba(115,115,115,0.25)',
      icon: Brain,
    }
  );
}

export const RELATIONSHIP_COLORS: Record<string, string> = {
  uses: '#4BA0FA',
  references: '#36FDFD',
  depends_on: '#F87171',
  implements: '#34D399',
  supersedes: '#FBBF24',
  related_to: '#A78BFA',
  calls: '#22D3EE',
  contains: '#818CF8',
  blocks: '#FB923C',
  fixes: '#34D399',
};
