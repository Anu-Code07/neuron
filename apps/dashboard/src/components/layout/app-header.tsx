'use client';

import { NeuronMark } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { useViewMode, type ViewMode } from '@/lib/view-mode';
import {
  Home,
  LayoutGrid,
  Network,
  Plug,
  Plus,
  Search,
  Settings,
  BookOpen,
  Code2,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  projectName?: string;
  onAddMemory?: () => void;
  onOpenSearch?: () => void;
}

const tabs: { id: ViewMode | 'integrations'; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'memories', label: 'Memories', icon: LayoutGrid },
  { id: 'graph', label: 'Graph', icon: Network },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'docs', label: 'Docs', icon: BookOpen },
  { id: 'mcp', label: 'MCP', icon: Code2 },
];

export function AppHeader({ projectName = 'My Project', onAddMemory, onOpenSearch }: AppHeaderProps) {
  const { viewMode, setViewMode } = useViewMode();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="relative z-20 flex shrink-0 items-center justify-between gap-2 p-2.5 md:p-3">
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        <button
          type="button"
          className="flex shrink-0 items-center rounded-lg px-1.5 py-1 transition-colors hover:bg-white/5"
        >
          <NeuronMark />
          <div className="ml-2 hidden flex-col items-start sm:flex">
            <p className="max-w-[16ch] truncate text-[10px] leading-tight text-[#6B6B6B] sm:text-[11px]">
              {projectName}
            </p>
            <p className="-mt-0.5 text-sm font-medium leading-none text-white/90 sm:text-lg">
              neuron
            </p>
          </div>
        </button>

        <nav className="hidden items-center gap-0.5 md:flex">
          {tabs.map((tab) => {
            const active = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewMode(tab.id as ViewMode)}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium',
                  active ? 'nav-tab-active' : 'nav-tab',
                )}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <button
          type="button"
          onClick={onAddMemory}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-sm font-medium hover:bg-white/10"
        >
          <Plus className="size-4" />
          <span className="hidden lg:inline">Add memory</span>
        </button>
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex size-9 items-center justify-center rounded-full border border-[#161F2C] text-muted hover:bg-white/5 hover:text-foreground"
          aria-label="Search"
        >
          <Search className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setViewMode('settings')}
          className={cn(
            'flex size-9 items-center justify-center rounded-full border border-[#161F2C] hover:bg-white/5',
            viewMode === 'settings' && 'nav-tab-active',
          )}
        >
          <Settings className="size-4" />
        </button>
        <button
          type="button"
          onClick={signOut}
          className="flex size-9 items-center justify-center rounded-full border border-[#161F2C] text-muted hover:bg-white/5 hover:text-red-300"
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
