'use client';

import { NeuronOrb } from '@/components/ui/neuron-orb';
import { cn } from '@/lib/utils';
import { useViewMode, type ViewMode } from '@/lib/view-mode';
import { Home, LayoutGrid, MoreHorizontal, Plus, Search, Sun } from 'lucide-react';

interface BottomNavProps {
  onAddMemory?: () => void;
  onOpenSearch?: () => void;
}

export function MobileBottomNav({ onAddMemory, onOpenSearch }: BottomNavProps) {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#0A0E14]/90 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl md:hidden"
    >
      <div className="flex items-center justify-around px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <NavTab label="Home" active={viewMode === 'home'} onClick={() => setViewMode('home')} icon={Home} />
        <NavTab label="Memories" active={viewMode === 'memories'} onClick={() => setViewMode('memories')} icon={LayoutGrid} />
        <button
          type="button"
          aria-label="Context chat"
          onClick={() => setViewMode('context')}
          className="group relative flex size-11 items-center justify-center rounded-full shadow-[0_0_18px_rgba(75,160,250,0.35)]"
        >
          <NeuronOrb size={40} className="pointer-events-none blur-[1px]" />
        </button>
        <NavTab label="Add" active={false} onClick={() => onAddMemory?.()} icon={Plus} />
        <NavTab label="More" active={viewMode === 'integrations' || viewMode === 'mcp'} onClick={() => setViewMode('integrations')} icon={MoreHorizontal} />
      </div>
    </nav>
  );
}

function NavTab({
  label,
  active,
  onClick,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: typeof Home;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-medium',
        active ? 'text-[#4BA0FA]' : 'text-[#737373]',
      )}
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}
